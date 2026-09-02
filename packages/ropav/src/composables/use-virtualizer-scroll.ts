import type { Size } from "../utils/virtualizer-geometry";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, toValue, watch } from "vue";

import { Point, Rect, Size as SizeClass } from "../utils/virtualizer-geometry";

/**
 * Measuring the scroll container a virtualizer lives in, ported from React Aria's `useScrollView`.
 *
 * Three things are being tracked, and they are not the same thing: the container's own size, how
 * far it has been scrolled, and how much of it the window viewport actually shows. The last one is
 * why a virtualized collection can be taller than the page and still only render what is on
 * screen — the visible rectangle is the container intersected with the viewport, so scrolling the
 * *page* moves the window too.
 *
 * Upstream applies a `padding: 0` reset and picks `overflow-x`/`overflow-y` for the container, but
 * the collection renderer throws those props away and never puts them on an element. They are
 * left out here rather than shipped as a difference nobody asked for: overflow comes from the
 * author's own classes.
 */

/** How long after the last scroll event the collection is considered settled, as upstream. */
const SCROLL_END_DELAY = 300;

export interface UseVirtualizerScrollOptions {
  /** The element that scrolls — the collection itself. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** The size of everything the layout produced, which is what gives the container its scroll. */
  contentSize: () => Size;
  /** Whether the collection is mid-scroll, which the content wrapper turns off pointers for. */
  isScrolling: () => boolean;
  onVisibleRectChange: (rect: Rect) => void;
  onSizeChange: (size: Size) => void;
  /**
   * How far rows measured above the window have pushed the content under it, and a way to say the
   * shift has been applied.
   *
   * Rows of a height nobody declared are placed at an estimate and corrected once they are in the
   * DOM. A correction above the window moves everything below it — so without putting the shift
   * back into the scroll offset, the collection slides under the pointer while it is read.
   */
  scrollAdjustment?: () => number;
  takeScrollAdjustment?: () => number;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

export interface UseVirtualizerScrollReturn {
  /** The style for the wrapper that gives the container something to scroll. */
  contentStyle: ComputedRef<Record<string, string | undefined>>;
  /** Re-measures the container. Called on mount, on resize, and by tests. */
  measure: () => void;
}

const px = (value: number): string | undefined =>
  Number.isFinite(value) ? `${value}px` : undefined;

export const useVirtualizerScroll = (
  options: UseVirtualizerScrollOptions,
): UseVirtualizerScrollReturn => {
  const state = {
    isScrolling: false,
    lastVisibleRect: new Rect(),
    scrollEndTime: 0,
    scrollPosition: new Point(),
    scrollTimeout: null as ReturnType<typeof setTimeout> | null,
    size: new SizeClass(),
    /** How far the container's top-left sits above the viewport, once it is scrolled past. */
    viewportOffset: new Point(),
    viewportSize: new SizeClass(),
  };

  let isMeasuring = false;

  const getElement = () => toValue(options.element) ?? null;

  const updateVisibleRect = () => {
    // The container intersected with the window viewport. A collection with no bound of its own
    // still virtualizes, because what the page shows of it is what counts.
    const visibleRect = new Rect(
      state.viewportOffset.x + state.scrollPosition.x,
      state.viewportOffset.y + state.scrollPosition.y,
      Math.max(0, Math.min(state.size.width - state.viewportOffset.x, state.viewportSize.width)),
      Math.max(0, Math.min(state.size.height - state.viewportOffset.y, state.viewportSize.height)),
    );

    // Nothing to say while the container has no area and had none before.
    if (visibleRect.area > 0 || state.lastVisibleRect.area > 0) {
      state.lastVisibleRect = visibleRect;
      options.onVisibleRectChange(visibleRect);
    }
  };

  const endScrolling = () => {
    state.isScrolling = false;
    state.scrollTimeout = null;
    options.onScrollEnd?.();
  };

  const scheduleScrollEnd = () => {
    const now = Date.now();

    // Rescheduling on every event would mean a clearTimeout per frame, so the timer is only
    // moved when it is close to firing.
    if (state.scrollEndTime > now + 50) return;

    state.scrollEndTime = now + SCROLL_END_DELAY;

    if (state.scrollTimeout != null) clearTimeout(state.scrollTimeout);

    state.scrollTimeout = setTimeout(endScrolling, SCROLL_END_DELAY);
  };

  const onScroll = (event: Event) => {
    const element = getElement();
    const target = event.target;

    if (!element || !(target instanceof Node) || !target.contains(element)) return;

    if (target === element) {
      // Clamped so an elastic over-scroll past either end does not shake the window, and clamped
      // against the element rather than against the layout: the browser is the one that knows how
      // tall the thing it is scrolling is *as rendered*, and asking the layout pulls a whole pass
      // forward for the offset this handler is about to replace.
      state.scrollPosition = new Point(
        Math.max(0, Math.min(element.scrollLeft, element.scrollWidth - state.size.width)),
        Math.max(0, Math.min(element.scrollTop, element.scrollHeight - state.size.height)),
      );
    } else {
      // An ancestor or the page scrolled: the container did not move inside itself, it moved
      // relative to the viewport.
      const bounds = element.getBoundingClientRect();
      const x = bounds.x < 0 ? -bounds.x : 0;
      const y = bounds.y < 0 ? -bounds.y : 0;

      if (x === state.viewportOffset.x && y === state.viewportOffset.y) return;

      state.viewportOffset = new Point(x, y);
    }

    updateVisibleRect();

    if (!state.isScrolling) {
      state.isScrolling = true;
      options.onScrollStart?.();
    }

    scheduleScrollEnd();
  };

  /**
   * Re-measures the container.
   *
   * The second pass is not belt and braces: laying out the content can make a scrollbar appear or
   * disappear, which changes the space available and therefore the layout. Browsers settle native
   * layouts the same way, in at most two passes.
   */
  const measure = () => {
    const element = getElement();

    if (!element || isMeasuring) return;

    isMeasuring = true;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportChanged =
      state.viewportSize.width !== viewportWidth || state.viewportSize.height !== viewportHeight;

    if (viewportChanged) state.viewportSize = new SizeClass(viewportWidth, viewportHeight);

    const clientWidth = element.clientWidth;
    const clientHeight = element.clientHeight;

    if (state.size.width !== clientWidth || state.size.height !== clientHeight || viewportChanged) {
      state.size = new SizeClass(clientWidth, clientHeight);
      updateVisibleRect();
      options.onSizeChange(state.size);

      if (element.clientWidth !== clientWidth || element.clientHeight !== clientHeight) {
        state.size = new SizeClass(element.clientWidth, element.clientHeight);
        updateVisibleRect();
        options.onSizeChange(state.size);
      }
    }

    isMeasuring = false;
  };

  watch(
    () => getElement(),
    (element, _previous, onCleanup) => {
      if (!element) return;

      const document = element.ownerDocument;

      // Capturing on the document, because a scroll event does not bubble: this is the only way
      // to hear about an ancestor scrolling the container out of the viewport.
      document.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", measure);

      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : // Border box, not content box: watching the content box loops forever when a
            // scrollbar appears and takes width away from it.
            new ResizeObserver(() => measure());

      observer?.observe(element, { box: "border-box" });
      measure();

      onCleanup(() => {
        document.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", measure);
        observer?.disconnect();
      });
    },
    { flush: "post", immediate: true },
  );

  // After the layout has run, not during it: the shift is worked out from where the rows were,
  // and the element has to be showing where they are now before the offset is moved to match.
  watch(
    () => options.scrollAdjustment?.() ?? 0,
    (adjustment) => {
      const element = getElement();

      if (!element || adjustment === 0) return;

      options.takeScrollAdjustment?.();
      element.scrollTop += adjustment;
    },
    { flush: "post" },
  );

  onScopeDispose(() => {
    if (state.scrollTimeout != null) clearTimeout(state.scrollTimeout);
  });

  return {
    contentStyle: computed(() => {
      const contentSize = options.contentSize();

      return {
        height: px(contentSize.height),
        // Pointers are dropped mid-scroll so a fast scroll does not hover every row it passes.
        pointerEvents: options.isScrolling() ? "none" : "auto",
        position: "relative",
        width: px(contentSize.width),
      };
    }),
    measure,
  };
};
