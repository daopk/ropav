import type {ScrollShadowVisibility} from "./scroll-shadow.types";
import type {MaybeRefOrGetter} from "vue";

import {computed, onScopeDispose, toValue, watch} from "vue";

export interface UseScrollShadowProps {
  container: MaybeRefOrGetter<HTMLElement | null | undefined>;
  orientation: MaybeRefOrGetter<"vertical" | "horizontal">;
  offset: MaybeRefOrGetter<number>;
  visibility: MaybeRefOrGetter<ScrollShadowVisibility>;
  isEnabled: MaybeRefOrGetter<boolean>;
  onVisibilityChange?: (visibility: ScrollShadowVisibility) => void;
}

export interface UseScrollShadowReturn {
  /** Re-measure immediately. The DOM write is batched into the next animation frame. */
  checkOverflow: () => void;
}

/**
 * Detect the scrollable edges around an element and publish them as `data-*` attributes.
 *
 * Ported from HeroUI React's `use-scroll-shadow.ts`. The callback reads every option lazily, so
 * orientation, offset, enabled state, and controlled/automatic mode all remain reactive in Vue.
 */
export const useScrollShadow = (options: UseScrollShadowProps): UseScrollShadowReturn => {
  let previous: {hasScrollAfter: boolean; hasScrollBefore: boolean} | null = null;
  let frame: number | null = null;

  const cancelPendingFrame = () => {
    if (frame === null) return;

    cancelAnimationFrame(frame);
    frame = null;
  };

  const checkOverflow = () => {
    const element = toValue(options.container);

    if (!element) return;

    const isVertical = toValue(options.orientation) === "vertical";
    const scrollStart = isVertical ? element.scrollTop : Math.abs(element.scrollLeft);
    const scrollSize = isVertical ? element.scrollHeight : element.scrollWidth;
    const clientSize = isVertical ? element.clientHeight : element.clientWidth;
    const offset = toValue(options.offset);

    const hasScrollBefore = scrollStart > offset;
    const hasScrollAfter = scrollStart + clientSize + offset < scrollSize - 1;

    if (
      previous?.hasScrollBefore === hasScrollBefore &&
      previous.hasScrollAfter === hasScrollAfter
    ) {
      return;
    }

    previous = {hasScrollAfter, hasScrollBefore};
    cancelPendingFrame();

    frame = requestAnimationFrame(() => {
      frame = null;

      if (isVertical) {
        if (hasScrollBefore && hasScrollAfter) {
          element.dataset["topBottomScroll"] = "true";
          delete element.dataset["topScroll"];
          delete element.dataset["bottomScroll"];
          options.onVisibilityChange?.("both");

          return;
        }

        element.dataset["topScroll"] = String(hasScrollBefore);
        element.dataset["bottomScroll"] = String(hasScrollAfter);
        delete element.dataset["topBottomScroll"];
        options.onVisibilityChange?.(hasScrollBefore ? "top" : hasScrollAfter ? "bottom" : "none");

        return;
      }

      if (hasScrollBefore && hasScrollAfter) {
        element.dataset["leftRightScroll"] = "true";
        delete element.dataset["leftScroll"];
        delete element.dataset["rightScroll"];
        options.onVisibilityChange?.("both");

        return;
      }

      element.dataset["leftScroll"] = String(hasScrollBefore);
      element.dataset["rightScroll"] = String(hasScrollAfter);
      delete element.dataset["leftRightScroll"];
      options.onVisibilityChange?.(hasScrollBefore ? "left" : hasScrollAfter ? "right" : "none");
    });
  };

  const element = computed(() => toValue(options.container));
  const isEnabled = computed(() => toValue(options.isEnabled));
  const visibility = computed(() => toValue(options.visibility));
  const orientation = computed(() => toValue(options.orientation));
  const offset = computed(() => toValue(options.offset));

  const stop = watch(
    [element, isEnabled, visibility, orientation, offset],
    ([current, enabled, mode], _previous, onCleanup) => {
      previous = null;
      cancelPendingFrame();

      if (!current || !enabled || mode !== "auto") return;

      checkOverflow();
      current.addEventListener("scroll", checkOverflow, {passive: true});

      const observer =
        typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(checkOverflow);

      observer?.observe(current);

      onCleanup(() => {
        current.removeEventListener("scroll", checkOverflow);
        observer?.disconnect();
        cancelPendingFrame();
        previous = null;
      });
    },
    {flush: "post", immediate: true},
  );

  onScopeDispose(() => {
    stop();
    cancelPendingFrame();
    previous = null;
  });

  return {checkOverflow};
};
