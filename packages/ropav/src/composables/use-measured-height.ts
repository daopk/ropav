import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

export interface UseMeasuredHeightReturn {
  /** The element's `scrollHeight`, or `undefined` until there is an element to measure. */
  height: ComputedRef<number | undefined>;
}

/**
 * An element's rendered height.
 *
 * `scrollHeight` rather than a `ResizeObserver` entry's box, because the caller needs the height
 * the content *wants*: a toast that is not frontmost is clipped to the front one's height, so its
 * own border box has already been overwritten by the very number this feeds.
 *
 * That overwriting is also why the height is unset before every reading. The value this produces
 * is what decides the element's own `height`, so reading it back off a sized box would return the
 * previous answer for ever — a toast whose content is replaced in place would keep the height of
 * the content it no longer holds.
 *
 * Three narrowings against the usual shape, each measured rather than assumed:
 *
 * 1. It measures directly on attach and then lets the observers take over, rather than relying on
 *    a first notification alone. jsdom *has* a `ResizeObserver` constructor but it never notifies
 *    anything, so an observer-only reading is permanently absent there — and this value drives an
 *    inline custom property that decides layout, which is exactly the kind of thing a fast suite
 *    should be able to assert. In a real browser the two readings agree, and the repeat is
 *    dropped, so the only difference is that the first one lands a frame earlier.
 * 2. Only the inline axis of a resize counts. The block axis is transitioned by the caller, and a
 *    reading forces layout twice to unset and restore the height — so reacting to it would
 *    re-measure on every frame of that animation and retarget the very transition it is watching.
 * 3. Content is watched separately, because a box whose height is already forced does not resize
 *    when what is inside it changes. Attributes are left out of that watch: the caller writes its
 *    state onto this element, and none of it changes what the content wants.
 */
export const useMeasuredHeight = (
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
): UseMeasuredHeightReturn => {
  const height = shallowRef<number | undefined>(undefined);

  let resizeObserver: ResizeObserver | undefined;
  let contentObserver: MutationObserver | undefined;
  let frame: number | undefined;

  const detach = () => {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    contentObserver?.disconnect();
    contentObserver = undefined;

    if (frame !== undefined && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(frame);
    }

    frame = undefined;
  };

  watch(
    () => toValue(elementRef) ?? null,
    (element) => {
      detach();

      if (!element) return;

      const measure = () => {
        const forced = element.style.height;

        element.style.height = "auto";

        const next = element.scrollHeight;

        element.style.height = forced;

        // Reported only on a real change: every reader of this drives an inline style on a
        // sibling, and a repeat write would be a layout pass for nothing.
        if (height.value !== next) height.value = next;
      };

      // One reading per frame however many notifications arrive, since each one costs two layout
      // passes and a burst of them describes a single new shape.
      const scheduleMeasure = () => {
        if (frame !== undefined || typeof requestAnimationFrame !== "function") return;

        frame = requestAnimationFrame(() => {
          frame = undefined;
          measure();
        });
      };

      measure();

      if (typeof MutationObserver === "function") {
        contentObserver = new MutationObserver(scheduleMeasure);
        contentObserver.observe(element, { characterData: true, childList: true, subtree: true });
      }

      if (typeof ResizeObserver === "undefined") return;

      let lastWidth = element.getBoundingClientRect().width;

      resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;

        if (width === undefined || Math.abs(width - lastWidth) < 0.5) return;

        lastWidth = width;
        scheduleMeasure();
      });
      resizeObserver.observe(element);
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(detach, true);

  return { height: computed(() => height.value) };
};
