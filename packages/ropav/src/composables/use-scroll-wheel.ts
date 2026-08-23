import type {MaybeRefOrGetter, ShallowRef} from "vue";

import {toValue, watch} from "vue";

/** The two axes of a wheel gesture, as the caller sees them. */
export interface ScrollWheelDelta {
  deltaX: number;
  deltaY: number;
}

export interface UseScrollWheelOptions {
  /** Called for every wheel gesture that is not a zoom. */
  onScroll?: (delta: ScrollWheelDelta) => void;
  /** While true no listener is attached at all, so the page scrolls normally. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * A wheel gesture over an element, ported from React Aria's
 * `packages/react-aria/src/interactions/useScrollWheel.ts` (react-aria 3.51.0).
 *
 * Three things it exists to remember. The listener has to be non-passive, or the page cannot be
 * stopped from scrolling — and a listener declared in a template is passive by default, so this
 * one is attached by hand. A gesture with `ctrlKey` held is a pinch-zoom, not a scroll, and must
 * be left alone. And the page is stopped for *every* gesture the element takes, on both axes,
 * even when the caller ignores that particular one: a control that answers the wheel should not
 * scroll the page out from under itself half the time.
 *
 * @example
 * ```ts
 * useScrollWheel(element, {isDisabled: () => !isFocused.value, onScroll: ({deltaY}) => step(deltaY)});
 * ```
 */
export const useScrollWheel = (
  element: ShallowRef<HTMLElement | null> | (() => HTMLElement | null),
  options: UseScrollWheelOptions,
): void => {
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;

    event.preventDefault();
    event.stopPropagation();

    options.onScroll?.({deltaX: event.deltaX, deltaY: event.deltaY});
  };

  watch(
    [element, () => toValue(options.isDisabled)],
    ([target, isDisabled], _previous, onCleanup) => {
      if (!target || isDisabled) return;

      target.addEventListener("wheel", onWheel, {passive: false});
      onCleanup(() => target.removeEventListener("wheel", onWheel));
    },
    {flush: "post", immediate: true},
  );
};
