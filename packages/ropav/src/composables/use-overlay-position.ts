import type { Placement, PlacementAxis, PositionResult } from "../utils/position";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { calculatePosition, getRect, translateRTL } from "../utils/position";

export interface UseOverlayPositionOptions {
  /** The element the overlay is positioned against. */
  targetRef: MaybeRefOrGetter<Element | null | undefined>;
  /** The overlay itself. */
  overlayRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /**
   * A scrollable region inside the overlay, if it is not the overlay itself. Used to keep the
   * focused item where it was when the overlay is repositioned.
   */
  scrollRef?: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** @default "bottom" */
  placement?: MaybeRefOrGetter<Placement | undefined>;
  /** @default 12 */
  containerPadding?: MaybeRefOrGetter<number | undefined>;
  /** @default 0 */
  offset?: MaybeRefOrGetter<number | undefined>;
  /** @default 0 */
  crossOffset?: MaybeRefOrGetter<number | undefined>;
  /** @default true */
  shouldFlip?: MaybeRefOrGetter<boolean | undefined>;
  /** @default document.body */
  boundaryElement?: MaybeRefOrGetter<Element | null | undefined>;
  /**
   * The arrow pointing at the trigger, if the overlay has one.
   *
   * Reported rather than measured from a size option, because the arrow is styled by the
   * stylesheet and only it knows how big it is. Its width reserves room on the cross axis, so
   * the overlay never sits so far along its trigger that the arrow would point past the edge.
   */
  arrowRef?: MaybeRefOrGetter<Element | null | undefined>;
  /** Overrides the measured arrow width, for a caller that knows it up front. */
  arrowSize?: MaybeRefOrGetter<number | undefined>;
  /** Distance kept between the arrow and the corner of the overlay. @default 0 */
  arrowBoundaryOffset?: MaybeRefOrGetter<number | undefined>;
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  maxHeight?: MaybeRefOrGetter<number | undefined>;
  /** Called when a scroll makes the position untrustworthy. */
  onClose?: (() => void) | null;
}

export interface UseOverlayPositionReturn {
  /** Inline style for the overlay: its resolved position, stacking and height cap. */
  overlayStyle: ComputedRef<Record<string, string>>;
  /** The side the overlay ended up on, for the stylesheet to key its entry animation on. */
  placement: ComputedRef<PlacementAxis | null>;
  /**
   * Inline style for the arrow: where along the overlay's edge it sits.
   *
   * Empty until the first measurement, so the arrow stays where its own stylesheet put it
   * rather than jumping in from a corner.
   */
  arrowStyle: ComputedRef<Record<string, string>>;
  /** Recompute the position, for a caller that changed something this cannot observe. */
  updatePosition: () => void;
}

/** Overlays sit above the page; matched to what the React build renders. */
const OVERLAY_Z_INDEX = 100000;

/** Whether an element or one of its descendants holds focus. */
const isFocusWithin = (element: Element) => {
  const active = document.activeElement;

  return Boolean(active && element.contains(active));
};

/**
 * Position an overlay next to its trigger and keep it there, ported from React Aria's
 * `useOverlayPosition`.
 *
 * The position is written straight to the element's inline style as well as being returned,
 * which looks redundant but is not: a render pass would land a frame late, and for one frame
 * the overlay would be visible at the wrong place — long enough to see as a jump, and long
 * enough for an auto-focused item to scroll the page to the wrong spot.
 *
 * The height cap is reset before every measurement. Otherwise a previous, smaller cap would
 * still be in force while the overlay is measured, and a menu whose items register a tick after
 * it opens would be measured at the wrong height and never recover.
 *
 * @example
 * ```ts
 * const {overlayStyle, placement} = useOverlayPosition({
 *   isOpen: () => state.isOpen.value,
 *   offset: 8,
 *   overlayRef: popoverElement,
 *   placement: "bottom start",
 *   targetRef: triggerElement,
 * });
 * ```
 */
export const useOverlayPosition = (
  options: UseOverlayPositionOptions,
): UseOverlayPositionReturn => {
  const position = shallowRef<PositionResult | null>(null);
  const triggerWidth = shallowRef<number | null>(null);

  const isOpen = computed(() => toValue(options.isOpen) ?? true);
  const placement = computed(() => toValue(options.placement) ?? ("bottom" as Placement));
  const containerPadding = computed(() => toValue(options.containerPadding) ?? 12);
  const offset = computed(() => toValue(options.offset) ?? 0);
  const crossOffset = computed(() => toValue(options.crossOffset) ?? 0);
  const shouldFlip = computed(() => toValue(options.shouldFlip) ?? true);
  const maxHeight = computed(() => toValue(options.maxHeight));
  const arrowBoundaryOffset = computed(() => toValue(options.arrowBoundaryOffset) ?? 0);

  const getTarget = () => toValue(options.targetRef) ?? null;
  const getOverlay = () => toValue(options.overlayRef) ?? null;
  const getScrollElement = () => toValue(options.scrollRef) ?? getOverlay();
  const getBoundary = () =>
    toValue(options.boundaryElement) ?? (typeof document === "undefined" ? null : document.body);
  const getArrow = () => toValue(options.arrowRef) ?? null;

  /**
   * Measured without its scale transform: an entering overlay is animating from a smaller size,
   * and a scaled-down arrow would reserve too little room on the cross axis.
   */
  const getArrowSize = () => {
    const declared = toValue(options.arrowSize);

    if (declared !== undefined) return declared;

    const arrow = getArrow();

    return arrow ? getRect(arrow, true).width : 0;
  };

  const updatePosition = () => {
    const overlay = getOverlay();
    const target = getTarget();
    const boundary = getBoundary();

    if (!isOpen.value || !overlay || !target || !boundary) return;

    // Remember where the focused element sat inside the scrollable region, so it can be put
    // back afterwards. Without this, a menu that grows or shrinks while open appears to jump
    // under the user's cursor.
    const scrollElement = getScrollElement();
    let anchor: { type: "top" | "bottom"; offset: number } | null = null;

    if (scrollElement && isFocusWithin(scrollElement)) {
      const anchorRect = document.activeElement?.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();

      anchor = { offset: (anchorRect?.top ?? 0) - scrollRect.top, type: "top" };

      // Anchored to whichever edge it is nearer, so the far edge is free to move.
      if (anchor.offset > scrollRect.height / 2) {
        anchor = { offset: (anchorRect?.bottom ?? 0) - scrollRect.bottom, type: "bottom" };
      }
    }

    if (maxHeight.value === undefined) {
      overlay.style.top = "0px";
      overlay.style.bottom = "";
      overlay.style.maxHeight = `${window.visualViewport?.height ?? window.innerHeight}px`;
    }

    /**
     * The trigger's width, written onto the element **before** the overlay is measured.
     *
     * The stylesheet turns this into the overlay's `min-width` for a picker, so publishing it
     * only through the reactive style below would measure the overlay at its content width and
     * place it there — and nothing repositions it once the rule widens it a flush later. Written
     * imperatively for the same reason `top` and `maxHeight` are above: the measurement has to
     * happen under the constraints the overlay will actually be laid out with.
     */
    const width = target.getBoundingClientRect().width;

    overlay.style.setProperty("--trigger-width", `${width}px`);
    triggerWidth.value = width;

    const direction = getComputedStyle(overlay).direction === "rtl" ? "rtl" : "ltr";
    const next = calculatePosition({
      arrowBoundaryOffset: arrowBoundaryOffset.value,
      arrowSize: getArrowSize(),
      boundaryElement: boundary,
      crossOffset: crossOffset.value,
      maxHeight: maxHeight.value,
      offset: offset.value,
      overlayNode: overlay,
      padding: containerPadding.value,
      placement: translateRTL(placement.value, direction),
      shouldFlip: shouldFlip.value,
      targetNode: target,
    });

    overlay.style.top = "";
    overlay.style.bottom = "";
    overlay.style.left = "";
    overlay.style.right = "";

    for (const [key, value] of Object.entries(next.position)) {
      overlay.style[key as "top" | "left" | "bottom" | "right"] = `${value}px`;
    }

    overlay.style.maxHeight = next.maxHeight != null ? `${next.maxHeight}px` : "";

    if (anchor && document.activeElement && scrollElement) {
      const anchorRect = document.activeElement.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();

      scrollElement.scrollTop += anchorRect[anchor.type] - scrollRect[anchor.type] - anchor.offset;
    }

    position.value = next;
  };

  const observers: (() => void)[] = [];

  const observe = (element: Element | null) => {
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => updatePosition());

    observer.observe(element);
    observers.push(() => observer.disconnect());
  };

  const stopObserving = () => {
    for (const stop of observers.splice(0)) stop();
  };

  // Reposition when any of the three changes size: the overlay may need to flip, the trigger
  // moving means the overlay is no longer beside it, and a restyled arrow reserves different
  // room on the cross axis.
  watch(
    [() => getOverlay(), () => getTarget(), isOpen, () => getArrow()],
    ([overlay, target, open]) => {
      stopObserving();

      // Dropped only when the overlay leaves the DOM, so the next open measures afresh rather
      // than animating in from wherever the last one happened to sit.
      if (!overlay) {
        position.value = null;

        return;
      }

      // A closed overlay that is still rendered is animating out, and it animates out from where
      // it was: clearing the position here would drop it at the viewport origin — which is where
      // an unmeasured overlay is put — for the length of the animation.
      if (!open) return;

      updatePosition();
      observe(overlay);
      observe(target);
      observe(getArrow());
    },
    { flush: "post", immediate: true },
  );

  watch(
    [placement, containerPadding, offset, crossOffset, shouldFlip, maxHeight, arrowBoundaryOffset],
    () => updatePosition(),
    { flush: "post" },
  );

  const onWindowResize = () => updatePosition();

  if (typeof window !== "undefined") {
    window.addEventListener("resize", onWindowResize, false);
  }

  /**
   * Scrolling a scrollable ancestor of the trigger moves the trigger out from under the
   * overlay, and there is no sane position left to take, so the overlay closes instead. The
   * document itself is excluded: page scroll is either blocked while the overlay is open, or
   * the overlay scrolls with it.
   */
  const scrollListeners: (() => void)[] = [];

  const attachCloseOnScroll = () => {
    const onClose = options.onClose;
    const target = getTarget();

    if (!onClose || !isOpen.value || !target) return;

    const onScroll = (event: Event) => {
      const scrollable = event.target;

      if (
        !(scrollable instanceof Element) ||
        scrollable === document.documentElement ||
        scrollable === document.body ||
        !scrollable.contains(target)
      ) {
        return;
      }

      onClose();
    };

    // Capture phase, because a scroll event does not bubble past the element that scrolled.
    window.addEventListener("scroll", onScroll, true);
    scrollListeners.push(() => window.removeEventListener("scroll", onScroll, true));
  };

  const detachCloseOnScroll = () => {
    for (const remove of scrollListeners.splice(0)) remove();
  };

  watch(
    [isOpen, () => getTarget()],
    () => {
      detachCloseOnScroll();
      attachCloseOnScroll();
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    stopObserving();
    detachCloseOnScroll();

    if (typeof window !== "undefined") {
      window.removeEventListener("resize", onWindowResize, false);
    }
  }, true);

  return {
    arrowStyle: computed(() => {
      const resolved = position.value;

      if (!resolved) return {};

      const style: Record<string, string> = {};

      if (resolved.arrowOffsetLeft !== undefined) style["left"] = `${resolved.arrowOffsetLeft}px`;
      if (resolved.arrowOffsetTop !== undefined) style["top"] = `${resolved.arrowOffsetTop}px`;

      return style;
    }),
    overlayStyle: computed(() => {
      const resolved = position.value;

      // Before the first measurement the overlay is placed at the viewport origin rather than
      // left where the document flow put it: it has to be laid out at its natural size to be
      // measured, and doing that in place could make the page scroll.
      if (!resolved) {
        return {
          left: "0px",
          "max-height": "100vh",
          position: "fixed",
          top: "0px",
          "z-index": String(OVERLAY_Z_INDEX),
        };
      }

      const style: Record<string, string> = {
        "max-height": `${resolved.maxHeight}px`,
        position: "absolute",
        "z-index": String(OVERLAY_Z_INDEX),
      };

      for (const [key, value] of Object.entries(resolved.position)) {
        style[key] = `${value}px`;
      }

      // The stylesheet uses this as the `transform-origin`, so the overlay grows out of its
      // trigger. A static comparison never catches it being wrong — only the animation shows it.
      style["--trigger-anchor-point"] =
        `${resolved.triggerAnchorPoint.x}px ${resolved.triggerAnchorPoint.y}px`;

      // Lets an overlay match the width of what opened it, which a select-style popover wants
      // and a menu does not — so it is published rather than applied.
      if (triggerWidth.value !== null) style["--trigger-width"] = `${triggerWidth.value}px`;

      return style;
    }),
    placement: computed(() => position.value?.placement ?? null),
    updatePosition,
  };
};
