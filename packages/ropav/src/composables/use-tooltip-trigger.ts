import type { FocusResponder } from "./focus-responder";
import type { TooltipTriggerState } from "./use-tooltip-trigger-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { useId } from "./use-id";
import {
  getInteractionModality,
  isFocusVisible,
  retainInteractionModality,
} from "./use-interaction-states";

export interface UseTooltipTriggerOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Opens on hover and on keyboard focus, or on focus alone. @default "hover" */
  trigger?: MaybeRefOrGetter<"hover" | "focus" | undefined>;
  /** Whether pressing the trigger closes the tooltip. @default true */
  shouldCloseOnPress?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseTooltipTriggerReturn {
  /** Hand to `provideFocusResponder`, so the focusable inside picks all of this up. */
  responder: FocusResponder;
  /** The id the tooltip carries, which the trigger's `aria-describedby` points at. */
  tooltipId: ComputedRef<string>;
  /** The trigger element, which the tooltip is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
}

/**
 * Turn any focusable into a tooltip trigger, ported from React Aria's `useTooltipTrigger`.
 *
 * Hover and focus are tracked separately and the tooltip follows whether **either** is still true,
 * which is what lets a user hover a button, tab away, and keep the tooltip — and what stops a
 * tooltip flickering when focus and hover arrive one after the other on the same element.
 *
 * Two gates keep it from opening when nobody asked. Hover only counts when the user is actually
 * moving a pointer: Chrome ends hover when something covers the trigger and restores it when that
 * goes away, so without the check a tooltip would reappear on its own. And focus only counts when
 * it came from a keyboard, or every click would leave a tooltip behind.
 *
 * @example
 * ```ts
 * const state = useTooltipTriggerState({delay: () => props.delay});
 * const trigger = useTooltipTrigger({isDisabled: () => props.isDisabled}, state);
 *
 * provideFocusResponder(trigger.responder);
 * ```
 */
export const useTooltipTrigger = (
  options: UseTooltipTriggerOptions,
  state: TooltipTriggerState,
): UseTooltipTriggerReturn => {
  const tooltipId = useId();
  const element = shallowRef<HTMLElement | null>(null);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const trigger = computed(() => toValue(options.trigger));
  const shouldCloseOnPress = computed(() => toValue(options.shouldCloseOnPress) ?? true);

  // Plain variables rather than refs: nothing renders from them, and they are read inside the
  // handler that just wrote them.
  let isHovered = false;
  let isFocused = false;

  /**
   * The modality is page-wide and only watched while some component is watching it, so the
   * trigger holds it open. Without this the answer would be whatever it was when the last
   * interactive component on the page went away, and hover would open tooltips on its own.
   */
  onScopeDispose(retainInteractionModality(), true);

  const show = () => {
    if (!isHovered && !isFocused) return;

    // Focus opens at once; hover waits out the delay.
    state.open(isFocused);
  };

  const hide = (immediate?: boolean) => {
    if (isHovered || isFocused) return;

    state.close(immediate);
  };

  /**
   * Escape closes the tooltip, listened for on the document and in the capture phase.
   *
   * The tooltip is not focused and neither is anything inside it — focus is still on the trigger,
   * or nowhere at all after a click — so there is no element on the path from the key to the
   * tooltip that could handle it. Capture phase so it is seen before anything cancels it.
   */
  watch(
    () => state.isOpen.value,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen) return;

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;

        // Stopped so a dialog behind the tooltip does not also close on the same key.
        event.stopPropagation();
        state.close(true);
      };

      document.addEventListener("keydown", onKeydown, true);
      onCleanup(() => document.removeEventListener("keydown", onKeydown, true));
    },
    // Post-flush, so the listener exists exactly when the tooltip is on screen rather than a
    // render before it — matching where React Aria puts the same effect.
    { flush: "post", immediate: true },
  );

  const onPointerenter = (event: PointerEvent) => {
    if (isDisabled.value || trigger.value === "focus") return;
    // A touch reports hover once as `touch` and again as `mouse`; neither should open a tooltip
    // there is no way to dismiss.
    if (event.pointerType === "touch") return;

    isHovered = getInteractionModality() === "pointer";
    show();
  };

  const onPointerleave = (event: PointerEvent) => {
    if (isDisabled.value || trigger.value === "focus") return;
    if (event.pointerType === "touch") return;

    // However the pointer left, the tooltip goes: leaving the trigger is the one gesture that
    // always means "not this one".
    isFocused = false;
    isHovered = false;
    hide();
  };

  const onPressStart = () => {
    if (!shouldCloseOnPress.value) return;

    isFocused = false;
    isHovered = false;
    // Instantly: a tooltip lingering over whatever the press opened is worse than none.
    hide(true);
  };

  const onFocus = () => {
    if (isDisabled.value) return;
    if (!isFocusVisible()) return;

    isFocused = true;
    show();
  };

  const onBlur = () => {
    isFocused = false;
    isHovered = false;
    hide(true);
  };

  const responder: FocusResponder = {
    attrs: computed(() => ({
      "aria-describedby": state.isOpen.value ? tooltipId.value : undefined,
    })),
    handlers: computed(() => ({
      onBlur,
      onFocus,
      onKeydown: onPressStart,
      onPointerdown: onPressStart,
      onPointerenter,
      onPointerleave,
    })),
    registerElement: (next) => {
      element.value = next;
    },
  };

  return { responder, tooltipId, triggerElement: computed(() => element.value) };
};
