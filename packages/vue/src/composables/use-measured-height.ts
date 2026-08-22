import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, shallowRef, toValue, watch} from "vue";

export interface UseMeasuredHeightReturn {
  /** The element's `scrollHeight`, or `undefined` until there is an element to measure. */
  height: ComputedRef<number | undefined>;
}

/**
 * An element's rendered height, ported from `@heroui/react`'s `useMeasuredHeight`.
 *
 * `scrollHeight` rather than a `ResizeObserver` entry's box, because the caller needs the height
 * the content *wants*: a toast that is not frontmost is clipped to the front one's height, so its
 * own border box has already been overwritten by the very number this feeds.
 *
 * Two narrowings against `@heroui/react`, both measured rather than assumed:
 *
 * 1. It measures directly on attach and then lets the observer take over, where React relies on
 *    the observer's first notification alone. jsdom *has* a `ResizeObserver` constructor but it
 *    never notifies anything, so an observer-only reading is permanently absent there — and this
 *    value drives an inline custom property that decides layout, which is exactly the kind of
 *    thing a fast suite should be able to assert. In a real browser the two readings agree, and
 *    the repeat is dropped, so the only difference is that the first one lands a frame earlier.
 * 2. React also watches `aria-hidden` with a `MutationObserver`. That attribute never reaches the
 *    DOM there — `react-aria-components` filters it off the toast — so the observer is dead code,
 *    and this package renders no `aria-hidden` for it to watch either.
 */
export const useMeasuredHeight = (
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
): UseMeasuredHeightReturn => {
  const height = shallowRef<number | undefined>(undefined);

  let observer: ResizeObserver | undefined;

  const detach = () => {
    observer?.disconnect();
    observer = undefined;
  };

  watch(
    () => toValue(elementRef) ?? null,
    (element) => {
      detach();

      if (!element) return;

      const measure = () => {
        const next = element.scrollHeight;

        // Reported only on a real change: every reader of this drives an inline style on a
        // sibling, and a repeat write would be a layout pass for nothing.
        if (height.value !== next) height.value = next;
      };

      measure();

      if (typeof ResizeObserver === "undefined") return;

      observer = new ResizeObserver(measure);
      observer.observe(element);
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(detach, true);

  return {height: computed(() => height.value)};
};
