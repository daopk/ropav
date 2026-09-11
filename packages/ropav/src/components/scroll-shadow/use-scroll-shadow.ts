import type { ScrollShadowVisibility } from "./scroll-shadow.types";
import type { MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, toValue, watch } from "vue";

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

/** Every attribute an edge is published as, which together are the whole state. */
const EDGE_ATTRIBUTES = [
  "topScroll",
  "bottomScroll",
  "topBottomScroll",
  "leftScroll",
  "rightScroll",
  "leftRightScroll",
] as const;

/**
 * Take every edge attribute off, so the stylesheet's mask stops applying.
 *
 * The attributes are the whole state, and the one place the mask is keyed on, so whoever stops
 * writing them has to take the last set off too or the fade stays painted at whatever it was.
 *
 * Reports whether anything was actually removed, so a caller telling the world the fade is gone
 * only says it when there was one.
 */
export const clearScrollShadowVisibility = (element: HTMLElement): boolean => {
  let cleared = false;

  for (const attribute of EDGE_ATTRIBUTES) {
    if (element.dataset[attribute] === undefined) continue;

    delete element.dataset[attribute];
    cleared = true;
  }

  return cleared;
};

/**
 * Detect the scrollable edges around an element and publish them as `data-*` attributes.
 *
 * The callback reads every option lazily, so orientation, offset, enabled state, and
 * controlled/automatic mode all remain reactive.
 */
export const useScrollShadow = (options: UseScrollShadowProps): UseScrollShadowReturn => {
  let previous: { hasScrollAfter: boolean; hasScrollBefore: boolean } | null = null;
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

    previous = { hasScrollAfter, hasScrollBefore };
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

      if (!current) return;

      /*
       * Being switched off has to undo the last measurement. In controlled mode the root owns
       * the attributes and clearing them here would wipe what it just wrote, so only the
       * automatic mode's own leftovers go.
       */
      if (mode !== "auto") return;

      if (!enabled) {
        // Reported as well as taken off: every other write pairs the two, and a caller mirroring
        // the last measurement has nothing else to tell it the fade has gone.
        if (clearScrollShadowVisibility(current)) options.onVisibilityChange?.("none");

        return;
      }

      checkOverflow();
      current.addEventListener("scroll", checkOverflow, { passive: true });

      const observer =
        typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(checkOverflow);

      /**
       * The container **and** everything directly inside it.
       *
       * Watching the container alone sees only half of what makes a region scrollable: the other
       * half is the content growing while the region keeps its size, which is what an accordion or
       * a disclosure opening inside one does. Nothing scrolls and nothing resizes, so a check that
       * waits for either turns up only once the reader scrolls — by which point the shadow has
       * stopped being the hint it exists to be.
       *
       * Direct children are enough. In normal flow nothing can grow the scrollable area without
       * growing one of them, so watching deeper would cost an entry per row and report the same
       * thing.
       */
      const observe = () => {
        observer?.disconnect();
        observer?.observe(current);
        for (const child of Array.from(current.children)) observer?.observe(child);
      };

      observe();

      // Children come and go, and a new one has to be picked up before it can be measured.
      const mutations =
        typeof MutationObserver === "undefined"
          ? undefined
          : new MutationObserver(() => {
              observe();
              checkOverflow();
            });

      mutations?.observe(current, { childList: true });

      onCleanup(() => {
        current.removeEventListener("scroll", checkOverflow);
        observer?.disconnect();
        mutations?.disconnect();
        cancelPendingFrame();
        previous = null;
      });
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    stop();
    cancelPendingFrame();
    previous = null;
  });

  return { checkOverflow };
};
