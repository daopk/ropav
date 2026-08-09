import type {DrawerPlacement} from "../components/drawer/drawer.types";
import type {MaybeRefOrGetter} from "vue";

import {toValue, watch} from "vue";

/** How far the pointer has to travel before the panel starts following it, in pixels. */
const DRAG_THRESHOLD = 8;

/** How much of the panel has to be dragged away before letting go dismisses it. */
const DISMISS_FRACTION = 0.3;

/** How fast a flick has to be to dismiss regardless of distance, in pixels per millisecond. */
const VELOCITY_THRESHOLD = 0.5;

/**
 * Where a drag must **not** start.
 *
 * Anything interactive keeps its own gesture, and the body keeps its scroll — a drawer whose list
 * could not be scrolled because every swipe dragged the whole panel would be worse than one that
 * cannot be dragged at all. The body is matched by its slot, which is what makes that attribute part
 * of the behaviour rather than only of the styling.
 */
const NO_DRAG_SELECTOR =
  "input, textarea, button, [role='button'], select, a, [data-slot='drawer-body']";

/** How the panel returns to rest when the drag was not far enough to dismiss. */
const SNAP_BACK_TRANSITION = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";

export interface UseDrawerDragOptions {
  /** The panel that moves. */
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Which edge the drawer is pinned to, which is the only direction it can be dragged away in. */
  placement: MaybeRefOrGetter<DrawerPlacement | undefined>;
  /** Whether dragging is allowed at all. */
  isDismissable: MaybeRefOrGetter<boolean | undefined>;
  /** Called once, when a drag ends far enough or fast enough to count as a dismissal. */
  onDismiss: () => void;
}

export interface UseDrawerDragHandlers {
  onPointerdown: (event: PointerEvent) => void;
  onPointermove: (event: PointerEvent) => void;
  onPointerup: (event: PointerEvent) => void;
  onPointercancel: (event: PointerEvent) => void;
}

export interface UseDrawerDragReturn {
  /**
   * Bind each one with `@event`, never through `v-bind`.
   *
   * The identities are stable for the life of the drawer, which is the point: a listener re-attached
   * between two events of the same gesture drops the rest of it.
   */
  handlers: UseDrawerDragHandlers;
}

/**
 * Drag a drawer's panel towards its own edge to dismiss it.
 *
 * Every write during a drag is imperative — `element.style.transform = …` — so a gesture from first
 * move to release causes **zero** renders. A reactive offset would mean a render per `pointermove`,
 * and a render in the middle of dispatching a pointer sequence is exactly the failure the rule about
 * handler binding exists to prevent.
 *
 * Three things here are deliberately stricter than the React implementation this is ported from:
 *
 * - `setPointerCapture` is feature-checked and wrapped, because jsdom's stub throws on a pointer id
 *   it has not seen and would take every test past the threshold down with it;
 * - a panel handed over mid-flight has any leftover inline `transform` and `transition` cleared,
 *   because the trick below outlives the element it was written on;
 * - `pointercancel` ends the gesture the same way a release does, so a drag the browser takes away
 *   does not leave the drawer stranded half off screen.
 *
 * @example
 * ```ts
 * const drag = useDrawerDrag({
 *   elementRef: element,
 *   isDismissable: () => overlay?.isDismissable.value,
 *   onDismiss: () => overlay?.close(),
 *   placement: () => placement.value,
 * });
 * ```
 */
export const useDrawerDrag = (options: UseDrawerDragOptions): UseDrawerDragReturn => {
  // Plain locals rather than refs: nothing here should ever cause a render.
  let isTracking = false;
  let isActive = false;
  let startPosition = 0;
  let lastPosition = 0;
  let lastTime = 0;
  let offset = 0;
  let velocity = 0;

  const element = () => toValue(options.elementRef) ?? null;
  const placement = () => toValue(options.placement);
  const isDismissable = () => toValue(options.isDismissable) ?? true;

  const isVertical = () => {
    const edge = placement();

    return edge === "top" || edge === "bottom";
  };

  const positionOf = (event: PointerEvent) => (isVertical() ? event.clientY : event.clientX);

  /** Only movement towards the panel's own edge counts; the other direction is held at rest. */
  const clamp = (delta: number) => {
    switch (placement()) {
      case "bottom":
      case "right":
        return Math.max(0, delta);
      case "top":
      case "left":
        return Math.min(0, delta);
      default:
        return delta;
    }
  };

  const reset = () => {
    isTracking = false;
    isActive = false;
    offset = 0;
    velocity = 0;
  };

  /**
   * A panel handed over while a drag is still remembered starts from a clean slate.
   *
   * The dismissal path deliberately leaves the inline `transform` in place so it compounds with the
   * slide out; if the same hook is later given a different element, that leftover would otherwise
   * appear on it as a panel already halfway gone.
   */
  watch(element, (next, previous) => {
    if (previous) {
      previous.style.transform = "";
      previous.style.transition = "";
    }

    if (next) {
      next.style.transform = "";
      next.style.transition = "";
    }

    reset();
  });

  const onPointerdown = (event: PointerEvent) => {
    if (!isDismissable()) return;
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;

    if (target?.closest(NO_DRAG_SELECTOR)) return;

    isTracking = true;
    isActive = false;
    startPosition = positionOf(event);
    lastPosition = startPosition;
    lastTime = event.timeStamp;
    offset = 0;
    velocity = 0;
  };

  const onPointermove = (event: PointerEvent) => {
    const panel = element();

    if (!isTracking || !panel) return;

    const position = positionOf(event);
    const raw = position - startPosition;
    const delta = clamp(raw);

    // Armed only once the pointer has really travelled, so a press that wobbles by a pixel is still
    // a press.
    if (!isActive) {
      if (Math.abs(raw) < DRAG_THRESHOLD) return;

      isActive = true;
      panel.style.transition = "none";

      // Keeps the rest of the gesture aimed at the panel even when the pointer leaves it, which is
      // most of the interesting cases: a drag towards the edge ends up over the backdrop.
      if (typeof panel.setPointerCapture === "function") {
        try {
          panel.setPointerCapture(event.pointerId);
        } catch {
          // Not every environment has a real pointer behind the id, and losing capture only costs
          // the gesture, not correctness.
        }
      }
    }

    offset = delta;

    const elapsed = event.timeStamp - lastTime;

    if (elapsed > 0) {
      velocity = (position - lastPosition) / elapsed;
      lastTime = event.timeStamp;
      lastPosition = position;
    }

    panel.style.transform = isVertical() ? `translateY(${delta}px)` : `translateX(${delta}px)`;
  };

  const onPointerup = (event: PointerEvent) => {
    if (!isTracking) return;

    const panel = element();

    if (!panel || !isActive) {
      reset();

      return;
    }

    isTracking = false;
    isActive = false;

    try {
      panel.releasePointerCapture(event.pointerId);
    } catch {
      // Already released, which is the normal path when the pointer ended over the panel.
    }

    const extent = isVertical() ? panel.offsetHeight : panel.offsetWidth;
    const shouldDismiss =
      Math.abs(offset) > extent * DISMISS_FRACTION || Math.abs(velocity) > VELOCITY_THRESHOLD;

    if (shouldDismiss) {
      // The inline transform is deliberately kept: it compounds with the exit animation, so the
      // panel carries on from where the finger left it instead of jumping back to rest first.
      offset = 0;
      velocity = 0;
      options.onDismiss();

      return;
    }

    panel.style.transition = SNAP_BACK_TRANSITION;
    panel.style.transform = "";
    panel.addEventListener(
      "transitionend",
      () => {
        panel.style.transition = "";
      },
      {once: true},
    );

    offset = 0;
    velocity = 0;
  };

  return {
    handlers: {
      onPointercancel: onPointerup,
      onPointerdown,
      onPointermove,
      onPointerup,
    },
  };
};
