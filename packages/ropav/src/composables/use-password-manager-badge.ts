import type { ComputedRef, MaybeRefOrGetter, ShallowRef } from "vue";

import { computed, shallowRef, toValue, watchEffect } from "vue";

/**
 * How far in from the container's right edge a badge is expected to sit, and how much room the
 * input gives up to make space for one.
 */
const PWM_BADGE_MARGIN_RIGHT = 18;
const PWM_BADGE_SPACE_WIDTH_PX = 40;
const PWM_BADGE_SPACE_WIDTH = `${PWM_BADGE_SPACE_WIDTH_PX}px` as const;

/**
 * Markers the well-known password managers leave on the elements they inject. Cheaper and more
 * reliable than hit-testing, so they are tried first.
 */
const PASSWORD_MANAGERS_SELECTORS = [
  "[data-lastpass-icon-root]",
  "com-1password-button",
  "[data-dashlanecreated]",
  '[style$="2147483647 !important;"]',
].join(",");

/** Whether the input gives up room for a badge at all. */
export type PushPasswordManagerStrategy = "increase-width" | "none";

export interface UsePasswordManagerBadgeOptions {
  /** The element a badge would be placed over. */
  container: ShallowRef<HTMLElement | null>;
  /** The control a password manager would attach itself to. */
  input: ShallowRef<HTMLInputElement | null>;
  pushPasswordManagerStrategy?: MaybeRefOrGetter<PushPasswordManagerStrategy | undefined>;
  isFocused: MaybeRefOrGetter<boolean>;
}

export interface UsePasswordManagerBadgeReturn {
  /** Whether a badge was detected over the container. */
  hasPWMBadge: ComputedRef<boolean>;
  /** Whether the input should actually widen: a badge was found *and* there is room for it. */
  willPushPWMBadge: ComputedRef<boolean>;
  /** How much room to give up, as a CSS length. */
  PWM_BADGE_SPACE_WIDTH: typeof PWM_BADGE_SPACE_WIDTH;
}

/**
 * Detects a password manager's badge sitting over the OTP control and reports whether the
 * control should shrink to get out from under it, ported from `input-otp@1.4.2`
 * (`src/use-pwm-badge.tsx`).
 *
 * A password manager cannot be asked whether it put a badge somewhere, so this guesses twice:
 * first by looking for the markers the well-known ones leave behind, then — finding none — by
 * hit-testing the point where a badge would be. The hit test answering "the container itself"
 * is read as *no badge*, which is a guess and stays a guess; that is why the search runs again
 * on a delay and then gives up for good rather than watching forever.
 *
 * @example
 * ```ts
 * const badge = usePasswordManagerBadge({container, input, isFocused});
 * // badge.willPushPWMBadge.value === true → narrow the control by badge.PWM_BADGE_SPACE_WIDTH
 * ```
 */
export const usePasswordManagerBadge = (
  options: UsePasswordManagerBadgeOptions,
): UsePasswordManagerBadgeReturn => {
  const { container, input } = options;

  const hasPWMBadge = shallowRef(false);
  const hasPWMBadgeSpace = shallowRef(false);
  // Latched once the answer is settled, so a badge that appears later is ignored rather than
  // moving the control around underneath someone who is already typing.
  const done = shallowRef(false);

  const strategy = computed(() => toValue(options.pushPasswordManagerStrategy) ?? "increase-width");

  const willPushPWMBadge = computed(() => {
    if (strategy.value === "none") return false;

    return hasPWMBadge.value && hasPWMBadgeSpace.value;
  });

  const trackPWMBadge = () => {
    const containerEl = container.value;

    if (!containerEl || !input.value || done.value || strategy.value === "none") return;

    // The top right-centre of the container, which is where most password managers put a badge.
    const rect = containerEl.getBoundingClientRect();
    const x = rect.left + containerEl.offsetWidth - PWM_BADGE_MARGIN_RIGHT;
    const y = rect.top + containerEl.offsetHeight / 2;

    if (document.querySelectorAll(PASSWORD_MANAGERS_SELECTORS).length === 0) {
      // Hitting the container itself means nothing is stacked on top of it, so most of the time
      // there is no badge. Not certain — hence the retries above this.
      if (document.elementFromPoint(x, y) === containerEl) return;
    }

    hasPWMBadge.value = true;
    done.value = true;
  };

  // Only worth widening the control if the extra width would stay on screen.
  watchEffect(
    (onCleanup) => {
      const containerEl = container.value;

      if (!containerEl || strategy.value === "none") return;

      const checkHasSpace = () => {
        const distanceToRightEdge = window.innerWidth - containerEl.getBoundingClientRect().right;

        hasPWMBadgeSpace.value = distanceToRightEdge >= PWM_BADGE_SPACE_WIDTH_PX;
      };

      checkHasSpace();

      // Polled rather than observed: the distance changes with the viewport, with any ancestor
      // that reflows, and with a scrollbar appearing, and no single observer covers all three.
      const interval = setInterval(checkHasSpace, 1000);

      onCleanup(() => clearInterval(interval));
    },
    { flush: "post" },
  );

  /**
   * The badge only exists once the field has focus, and it does not appear instantly, so the
   * search runs three times over five seconds and then stops for good.
   */
  watchEffect(
    (onCleanup) => {
      const isFocused = toValue(options.isFocused) || document.activeElement === input.value;

      if (strategy.value === "none" || !isFocused || done.value) return;

      const timers = [
        setTimeout(trackPWMBadge, 0),
        setTimeout(trackPWMBadge, 2000),
        setTimeout(trackPWMBadge, 5000),
        setTimeout(() => {
          done.value = true;
        }, 6000),
      ];

      onCleanup(() => timers.forEach(clearTimeout));
    },
    { flush: "post" },
  );

  return {
    PWM_BADGE_SPACE_WIDTH,
    hasPWMBadge: computed(() => hasPWMBadge.value),
    willPushPWMBadge,
  };
};
