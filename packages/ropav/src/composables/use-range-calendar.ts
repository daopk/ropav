import type { UseCalendarOptions, UseCalendarReturn } from "./use-calendar";
import type { RangeCalendarState } from "./use-range-calendar-state";
import type { MaybeRefOrGetter } from "vue";

import { onScopeDispose, toValue, watch } from "vue";

import { useCalendar } from "./use-calendar";
import { isVirtualPointerEvent } from "./use-press";

/**
 * What to do with a half-built range when the pointer comes up somewhere else, or focus leaves.
 *
 * - `clear`: drop the selection entirely.
 * - `reset`: put the previously selected range back.
 * - `select`: take the range the user is hovering.
 */
export type RangeCalendarCommitBehavior = "clear" | "reset" | "select";

export interface UseRangeCalendarOptions extends UseCalendarOptions {
  /** @default "select" */
  commitBehavior?: MaybeRefOrGetter<RangeCalendarCommitBehavior | undefined>;
  /** The calendar's own element, which is what tells an outside release from an inside one. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

export interface UseRangeCalendarReturn extends UseCalendarReturn {
  /** Wire with `@event`, never with `v-bind`. */
  handlers: {
    onFocusout: (event: FocusEvent) => void;
  };
}

/** Whether an element or one of its descendants holds focus. */
const isFocusWithin = (element: Element) => {
  const active = document.activeElement;

  return Boolean(active && element.contains(active));
};

/**
 * The behaviour and accessibility wiring for a range calendar.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useRangeCalendar.ts`
 * (react-aria 3.51.0).
 *
 * Everything here is about ending a range the user walked away from mid-selection. A pointer
 * released outside the calendar, or focus leaving it, has to resolve the pending range one way or
 * another — leaving an anchor pinned would make the next click somewhere unrelated finish a range
 * the user has forgotten about.
 */
export const useRangeCalendar = (
  options: UseRangeCalendarOptions,
  state: RangeCalendarState,
): UseRangeCalendarReturn => {
  const calendar = useCalendar(options, state);

  const commit = () => {
    switch (toValue(options.commitBehavior) ?? "select") {
      case "clear":
        state.clearSelection();
        break;
      case "reset":
        state.setAnchorDate(null);
        break;
      default:
        state.commitSelection();
    }
  };

  /*
   * VoiceOver fires a zero-sized pointer event before the click it stands for, and acting on it
   * would end the range before the cell's own press handler ever runs. `usePress` waits for the
   * click for the same reason, so the two have to agree or range selection stops working under a
   * screen reader — which is why the question is asked of the same predicate rather than answered
   * again here.
   */
  let isVirtualClick = false;

  const onWindowPointerdown = (event: PointerEvent) => {
    isVirtualClick = isVirtualPointerEvent(event);
  };

  const onWindowPointerup = (event: PointerEvent) => {
    if (isVirtualClick) {
      isVirtualClick = false;

      return;
    }

    state.setDragging(false);

    if (!state.anchorDate.value) return;

    const element = toValue(options.element);

    if (!element || !isFocusWithin(element)) return;

    const target = event.target;
    const isInside = target instanceof Node && element.contains(target);
    const isButton = target instanceof Element && target.closest('button, [role="button"]') != null;

    /*
     * Only when focus is still inside the calendar — otherwise a click anywhere on the page would
     * finish a range nobody is looking at. A press on a button inside is left alone, so paging to
     * another month while building a range does not end it.
     */
    if (!isInside || !isButton) commit();
  };

  /** Keep a finger dragging a range from scrolling the page under it. */
  const onTouchmove = (event: TouchEvent) => {
    if (state.isDragging.value) event.preventDefault();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", onWindowPointerdown);
    window.addEventListener("pointerup", onWindowPointerup);
  }

  /*
   * Capture phase and explicitly not passive, because a passive listener may not preventDefault —
   * which is the entire point of this one.
   */
  let touchmoveElement: HTMLElement | null = null;

  const detachTouchmove = () => {
    touchmoveElement?.removeEventListener("touchmove", onTouchmove, { capture: true });
    touchmoveElement = null;
  };

  watch(
    () => toValue(options.element),
    (element) => {
      detachTouchmove();

      if (!element) return;

      element.addEventListener("touchmove", onTouchmove, { capture: true, passive: false });
      touchmoveElement = element;
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => {
    detachTouchmove();

    if (typeof window === "undefined") return;

    window.removeEventListener("pointerdown", onWindowPointerdown);
    window.removeEventListener("pointerup", onWindowPointerup);
  });

  return {
    ...calendar,
    handlers: {
      // Tabbing away mid-selection resolves the range too: there is no pointer release to wait for.
      onFocusout: (event) => {
        const element = toValue(options.element);

        if (!element) return;

        const next = event.relatedTarget;

        if (
          (!next || !(next instanceof Node) || !element.contains(next)) &&
          state.anchorDate.value
        ) {
          commit();
        }
      },
    },
  };
};
