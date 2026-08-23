import type { UseOverlayTriggerStateOptions } from "./use-overlay-trigger-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue } from "vue";

import { useOverlayTriggerState } from "./use-overlay-trigger-state";

export interface UseTooltipTriggerStateOptions extends UseOverlayTriggerStateOptions {
  /** How long the pointer has to rest on the trigger before the tooltip opens. @default 1500 */
  delay?: MaybeRefOrGetter<number | undefined>;
  /** How long the tooltip stays after the pointer leaves. @default 500 */
  closeDelay?: MaybeRefOrGetter<number | undefined>;
}

export interface TooltipTriggerState {
  isOpen: ComputedRef<boolean>;
  /**
   * Whether this open or close is happening without an animation.
   *
   * True while the global warmup timer is running, which is the case where one tooltip replaces
   * another as the pointer sweeps along a row of buttons: the first waits out the delay, and the
   * rest appear at once because a tooltip is already on screen.
   */
  shouldSkipAnimation: ComputedRef<boolean>;
  /** Opens after the delay, or at once when `immediate` is set. */
  open: (immediate?: boolean) => void;
  /** Closes after the close delay, or at once when `immediate` is set. */
  close: (immediate?: boolean) => void;
}

/** Spectrum's numbers, and the floor the cooldown is measured against. */
const TOOLTIP_DELAY = 1500;
const TOOLTIP_COOLDOWN = 500;

/**
 * Every live tooltip, so opening one closes the rest.
 *
 * At module scope because the rule it enforces is global: one tooltip on screen at a time, and a
 * warmup period shared by all of them. React Stately keeps exactly this state in exactly this
 * place, and it is the reason a tooltip cannot own its own timers alone.
 */
const tooltips = new Map<string, (immediate?: boolean, instant?: boolean) => void>();

let tooltipId = 0;
let globalWarmedUp = false;
let globalWarmUpTimeout: ReturnType<typeof setTimeout> | null = null;
let globalCooldownTimeout: ReturnType<typeof setTimeout> | null = null;

const clearWarmUpTimeout = () => {
  if (globalWarmUpTimeout === null) return;

  clearTimeout(globalWarmUpTimeout);
  globalWarmUpTimeout = null;
};

const clearCooldownTimeout = () => {
  if (globalCooldownTimeout === null) return;

  clearTimeout(globalCooldownTimeout);
  globalCooldownTimeout = null;
};

/**
 * Forget the shared warmup state.
 *
 * For a test: the registry and both timers outlive any one component, so a case that leaves a
 * tooltip warm would make the next one open with no delay and read as a bug in that test instead.
 */
export const resetTooltipWarmup = (): void => {
  tooltips.clear();
  clearWarmUpTimeout();
  clearCooldownTimeout();
  globalWarmedUp = false;
};

/** How many tooltips are registered. For a test proving a disposed trigger left nothing behind. */
export const getRegisteredTooltipCount = (): number => tooltips.size;

/**
 * Open state for a tooltip trigger, ported from React Stately's `useTooltipTriggerState`.
 *
 * Two things beyond a plain overlay trigger, and both are about time rather than state. A tooltip
 * waits before appearing, so a pointer crossing a toolbar does not leave a trail of them; and the
 * wait is shared, so once one tooltip has earned its place the next appears at once. The shared
 * part is what makes a row of icon buttons feel like one control rather than a dozen.
 *
 * @example
 * ```ts
 * const state = useTooltipTriggerState({
 *   closeDelay: () => props.closeDelay,
 *   delay: () => props.delay,
 *   isOpen: () => props.isOpen,
 *   onOpenChange: (isOpen) => emit("openChange", isOpen),
 * });
 * ```
 */
export const useTooltipTriggerState = (
  options: UseTooltipTriggerStateOptions = {},
): TooltipTriggerState => {
  const overlay = useOverlayTriggerState(options);

  const delay = computed(() => toValue(options.delay) ?? TOOLTIP_DELAY);
  const closeDelay = computed(() => toValue(options.closeDelay) ?? TOOLTIP_COOLDOWN);

  const shouldSkipAnimation = shallowRef(false);

  const id = `${++tooltipId}`;

  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearCloseTimeout = () => {
    if (closeTimeout === null) return;

    clearTimeout(closeTimeout);
    closeTimeout = null;
  };

  /**
   * Close every other tooltip at once, with no exit animation.
   *
   * Instant rather than delayed because this one is taking its place: two tooltips fading past
   * each other reads as a glitch, where a straight swap reads as the label following the pointer.
   */
  const closeOpenTooltips = () => {
    for (const [otherId, hide] of [...tooltips]) {
      if (otherId === id) continue;

      hide(true, true);
      tooltips.delete(otherId);
    }
  };

  const showTooltip = (instant?: boolean) => {
    clearCloseTimeout();
    closeOpenTooltips();
    tooltips.set(id, hideTooltip);
    shouldSkipAnimation.value = Boolean(instant);
    globalWarmedUp = true;
    overlay.open();
    clearWarmUpTimeout();
    clearCooldownTimeout();
  };

  const hideTooltip = (immediate?: boolean, instant?: boolean) => {
    shouldSkipAnimation.value = Boolean(instant);

    if (immediate || closeDelay.value <= 0) {
      clearCloseTimeout();
      overlay.close();
    } else if (closeTimeout === null) {
      closeTimeout = setTimeout(() => {
        closeTimeout = null;
        overlay.close();
      }, closeDelay.value);
    }

    clearWarmUpTimeout();

    if (!globalWarmedUp) return;

    clearCooldownTimeout();

    // The floor is the constant, not this tooltip's close delay — a tooltip that closes fast must
    // not shorten the window in which the next one appears instantly.
    globalCooldownTimeout = setTimeout(
      () => {
        tooltips.delete(id);
        globalCooldownTimeout = null;
        globalWarmedUp = false;
      },
      Math.max(TOOLTIP_COOLDOWN, closeDelay.value),
    );
  };

  const warmupTooltip = () => {
    closeOpenTooltips();
    tooltips.set(id, hideTooltip);

    if (!overlay.isOpen.value && !globalWarmedUp) {
      clearWarmUpTimeout();

      globalWarmUpTimeout = setTimeout(() => {
        globalWarmUpTimeout = null;
        globalWarmedUp = true;
        // First of a sequence, so it animates in.
        showTooltip(false);
      }, delay.value);
    } else if (!overlay.isOpen.value) {
      // Something is already on screen, so this one replaces it rather than arriving.
      showTooltip(true);
    }
  };

  onScopeDispose(() => {
    clearCloseTimeout();
    tooltips.delete(id);
  }, true);

  return {
    close: hideTooltip,
    isOpen: overlay.isOpen,
    open: (immediate) => {
      if (!immediate && delay.value > 0 && closeTimeout === null) {
        warmupTooltip();
      } else {
        // An immediate open still skips its animation when another tooltip is already warm, so
        // keyboard focus moving along a toolbar behaves the same way the pointer does.
        showTooltip(globalWarmedUp);
      }
    },
    shouldSkipAnimation: computed(() => shouldSkipAnimation.value),
  };
};
