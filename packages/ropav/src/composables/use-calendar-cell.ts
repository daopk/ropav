import type {AnyCalendarState, CalendarShared} from "./use-calendar";
import type {PressEvent, UsePressHandlers} from "./use-press";
import type {CalendarDate} from "@internationalized/date";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {isSameDay, isToday} from "@internationalized/date";
import {computed, onScopeDispose, toValue, watch} from "vue";

import {calendarStrings} from "../i18n/calendar";
import {getScrollParent} from "../utils/focus";

import {isRangeCalendarState} from "./use-calendar";
import {useDateFormatter} from "./use-date-formatter";
import {useDescription} from "./use-description";
import {getInteractionModality} from "./use-interaction-states";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";
import {usePress} from "./use-press";

/** How long a finger has to stay down before it counts as dragging a range rather than scrolling. */
const TOUCH_DRAG_DELAY = 200;

export interface UseCalendarCellOptions {
  /** The date this cell stands for. */
  date: MaybeRefOrGetter<CalendarDate>;
  /** Forces the cell disabled, on top of the calendar's own bounds. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the cell shows a date from a neighbouring month. */
  isOutsideMonth?: MaybeRefOrGetter<boolean | undefined>;
  /** The element focus lands on, read lazily so a template ref that fills in later still works. */
  element: MaybeRefOrGetter<HTMLElement | null | undefined>;
}

export interface UseCalendarCellReturn {
  /** Spread with `v-bind` onto the grid cell. Never carries an `on*` key. */
  cellAttrs: ComputedRef<Record<string, unknown>>;
  /** Spread with `v-bind` onto the focusable element inside the cell. */
  buttonAttrs: ComputedRef<Record<string, unknown>>;
  /** Wire with `@event`, never with `v-bind`. */
  handlers: UsePressHandlers & {
    onFocus: () => void;
    onPointerenter: (event: PointerEvent) => void;
    onContextmenu: (event: MouseEvent) => void;
  };
  isPressed: ComputedRef<boolean>;
  isSelected: ComputedRef<boolean>;
  isFocused: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isUnavailable: ComputedRef<boolean>;
  isOutsideVisibleRange: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  isToday: ComputedRef<boolean>;
  /** The day number written for the current locale and calendar system. */
  formattedDate: ComputedRef<string>;
}

/**
 * The behaviour and accessibility wiring for one date cell.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useCalendarCell.ts`
 * (react-aria 3.51.0).
 *
 * The cell is a `role="button"` inside a `role="gridcell"` rather than a `<button>`, and its label
 * is the whole date rather than the day number — a screen reader reading "15" out of a grid tells
 * the user nothing about which month or year they are in.
 */
export const useCalendarCell = (
  options: UseCalendarCellOptions,
  state: AnyCalendarState,
  shared: CalendarShared,
): UseCalendarCellReturn => {
  const stringFormatter = useLocalizedStringFormatter(calendarStrings);
  const date = computed(() => toValue(options.date));
  const isOutsideMonth = computed(() => Boolean(toValue(options.isOutsideMonth)));

  const dateFormatter = useDateFormatter(() => ({
    day: "numeric",
    era:
      date.value.calendar.identifier === "gregory" && date.value.era === "BC" ? "short" : undefined,
    month: "long",
    timeZone: state.timeZone.value,
    weekday: "long",
    year: "numeric",
  }));

  const cellDateFormatter = useDateFormatter(() => ({
    calendar: date.value.calendar.identifier,
    day: "numeric",
    timeZone: state.timeZone.value,
  }));

  const nativeDate = computed(() => date.value.toDate(state.timeZone.value));

  // A cell from a neighbouring month is shown but never focusable, so the arrow keys cannot land
  // on a date the grid does not own.
  const isFocused = computed(() => state.isCellFocused(date.value) && !isOutsideMonth.value);

  const isDisabled = computed(
    () =>
      Boolean(toValue(options.isDisabled)) ||
      state.isCellDisabled(date.value) ||
      isOutsideMonth.value,
  );
  const isUnavailable = computed(() => state.isCellUnavailable(date.value));
  const isSelectable = computed(() => !isDisabled.value && !isUnavailable.value);

  const isInvalid = computed(() => {
    if (!state.isValueInvalid.value) return false;

    if (isRangeCalendarState(state)) {
      const range = state.highlightedRange.value;

      return (
        !state.anchorDate.value &&
        range != null &&
        date.value.compare(range.start) >= 0 &&
        date.value.compare(range.end) <= 0
      );
    }

    const value = state.value.value;

    if (Array.isArray(value)) return value.some((entry) => isSameDay(entry, date.value));
    if (value && !("start" in value)) return isSameDay(value, date.value);

    return false;
  });

  /*
   * An invalid selection still reads as selected, so the cell that caused the error is the one the
   * user sees marked. Disabled cells are left alone — they could not have caused it.
   */
  const isSelected = computed(
    () =>
      (state.isSelected(date.value) && isSelectable.value) ||
      (isInvalid.value && !isDisabled.value),
  );

  const isDateToday = computed(() => isToday(date.value, state.timeZone.value));

  const label = computed(() => {
    let text = "";

    // On a range calendar the two ends carry a description of the whole range, so a screen reader
    // reaching either one hears what is selected rather than just that day.
    if (isRangeCalendarState(state)) {
      const range = state.value.value;

      if (
        range &&
        !state.anchorDate.value &&
        (isSameDay(date.value, range.start) || isSameDay(date.value, range.end))
      ) {
        text = `${shared.selectedDateDescription.value}, `;
      }
    }

    text += dateFormatter.value.format(nativeDate.value);

    if (isDateToday.value) {
      text = stringFormatter.value.format(isSelected.value ? "todayDateSelected" : "todayDate", {
        date: text,
      });
    } else if (isSelected.value) {
      text = stringFormatter.value.format("dateSelected", {date: text});
    }

    // The bounds are named, so a user arriving at one knows why the arrows stopped moving.
    if (state.minValue.value && isSameDay(date.value, state.minValue.value)) {
      text += `, ${stringFormatter.value.format("minimumDate")}`;
    } else if (state.maxValue.value && isSameDay(date.value, state.maxValue.value)) {
      text += `, ${stringFormatter.value.format("maximumDate")}`;
    }

    return text;
  });

  /**
   * A prompt telling a screen reader user that a range takes two presses.
   *
   * Nothing on screen says so, and the two presses look identical from the outside, so this is the
   * only way a non-visual user learns what the second one is for.
   */
  const rangeSelectionPrompt = computed(() => {
    if (!isRangeCalendarState(state)) return undefined;
    if (!isFocused.value || state.isReadOnly.value || !isSelectable.value) return undefined;

    return stringFormatter.value.format(
      state.anchorDate.value ? "finishRangeSelectionPrompt" : "startRangeSelectionPrompt",
    );
  });

  const {describedBy} = useDescription(rangeSelectionPrompt);

  let isAnchorPressed = false;
  let isRangeBoundaryPressed = false;
  let touchDragTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTouchDragTimer = () => {
    clearTimeout(touchDragTimer);
    touchDragTimer = undefined;
  };

  onScopeDispose(clearTouchDragTimer);

  const {handlers: pressHandlers, isPressed} = usePress({
    isDisabled: () => !isSelectable.value || state.isReadOnly.value,
    onPress: () => {
      // A single-date calendar always selects on the way up.
      if (!isRangeCalendarState(state) && !state.isReadOnly.value) {
        state.selectDate(date.value);
        state.setFocusedDate(date.value);
        state.setFocused(true);
      }
    },
    onPressEnd: () => {
      isRangeBoundaryPressed = false;
      isAnchorPressed = false;
      clearTouchDragTimer();
    },
    onPressStart: (event: PressEvent) => {
      if (state.isReadOnly.value) {
        state.setFocusedDate(date.value);
        state.setFocused(true);

        return;
      }

      if (
        !isRangeCalendarState(state) ||
        state.anchorDate.value ||
        (event.pointerType !== "mouse" && event.pointerType !== "touch")
      ) {
        return;
      }

      const range = state.highlightedRange.value;

      /*
       * Pressing an end of an existing range picks that end up rather than starting a new
       * selection. Not while invalid, because the range is constrained to available dates and
       * dragging from a bad range jumps unpredictably.
       */
      if (range && !isInvalid.value) {
        for (const [end, other] of [
          [range.start, range.end],
          [range.end, range.start],
        ] as const) {
          if (!isSameDay(date.value, end)) continue;

          state.setAnchorDate(other);
          state.setFocusedDate(date.value);
          state.setFocused(true);
          state.setDragging(true);
          isRangeBoundaryPressed = true;

          return;
        }
      }

      const startDragging = () => {
        state.setDragging(true);
        touchDragTimer = undefined;

        state.selectDate(date.value);
        state.setFocusedDate(date.value);
        state.setFocused(true);
        isAnchorPressed = true;
      };

      // A finger gets a moment first: a press that turns into a scroll must not start a range.
      if (event.pointerType === "touch")
        touchDragTimer = setTimeout(startDragging, TOUCH_DRAG_DELAY);
      else startDragging();
    },
    onPressUp: (event: PressEvent) => {
      if (state.isReadOnly.value || !isRangeCalendarState(state)) return;

      // A quick tap comes up before the drag timer fired, so the date is selected here instead.
      if (touchDragTimer) {
        state.selectDate(date.value);
        state.setFocusedDate(date.value);
        state.setFocused(true);
      }

      if (isRangeBoundaryPressed) {
        // Pressing an end of a selected range starts a new selection from it, so the same press
        // can either drag the end or begin again.
        state.setAnchorDate(date.value);
      } else if (state.anchorDate.value && !isAnchorPressed) {
        state.selectDate(date.value);
        state.setFocusedDate(date.value);
        state.setFocused(true);
      } else if (event.pointerType === "keyboard" && !state.anchorDate.value) {
        // Moving focus on by one is what tells a keyboard user a range is being built rather than
        // a single date chosen. A mouse user sees the same thing from the hover highlight.
        state.selectDate(date.value);
        state.focusNearestAvailableDate(date.value);
      } else if (event.pointerType === "virtual") {
        // A screen reader has no hover to show a pending range, so one activation selects.
        state.selectDate(date.value);
        state.setFocusedDate(date.value);
        state.setFocused(true);
      }
    },
  });

  /*
   * Move real focus to whichever cell the state says is focused.
   *
   * Post-flush, because the cell has to exist first — paging replaces the whole grid, and the date
   * that should hold focus is in the batch being rendered.
   */
  watch(
    [isFocused, () => toValue(options.element)],
    ([focused, element]) => {
      if (!focused || !element) return;

      element.focus({preventScroll: true});

      /*
       * Only bring it into view for a keyboard user: scrolling under a mouse or finger moves the
       * thing the user is aiming at. Checked after focusing, because a cell inside an inert
       * container never took it.
       */
      if (getInteractionModality() !== "pointer" && document.activeElement === element) {
        /*
         * React scrolls within the nearest scrollable ancestor so an overlay above does not shift;
         * the browser's own `nearest` does the same thing for the cases this package renders. Only
         * when there is something to scroll, and only where the method exists — jsdom has neither.
         */
        if (getScrollParent(element) && typeof element.scrollIntoView === "function") {
          element.scrollIntoView({block: "nearest", inline: "nearest"});
        }
      }
    },
    {flush: "post", immediate: true},
  );

  const tabIndex = computed(() => {
    if (isDisabled.value) return undefined;

    return isSameDay(date.value, state.focusedDate.value) ? 0 : -1;
  });

  return {
    buttonAttrs: computed(() => ({
      "aria-describedby":
        [isInvalid.value ? shared.errorMessageId.value : undefined, describedBy.value]
          .filter(Boolean)
          .join(" ") || undefined,
      "aria-disabled": !isSelectable.value || undefined,
      "aria-invalid": isInvalid.value || undefined,
      "aria-label": label.value,
      role: "button",
      tabindex: tabIndex.value,
    })),
    cellAttrs: computed(() => ({
      "aria-disabled": !isSelectable.value || undefined,
      "aria-invalid": isInvalid.value || undefined,
      "aria-selected": isSelected.value || undefined,
      role: "gridcell",
    })),
    formattedDate: computed(
      () =>
        cellDateFormatter.value.formatToParts(nativeDate.value).find((part) => part.type === "day")!
          .value,
    ),
    handlers: {
      ...pressHandlers,
      onContextmenu: (event) => {
        // A long press on touch would otherwise open the context menu instead of dragging a range.
        event.preventDefault();
      },
      onFocus: () => {
        if (isDisabled.value) return;

        state.setFocusedDate(date.value);
        state.setFocused(true);
      },
      onPointerdown: (event) => {
        /*
         * Releasing the implicit pointer capture is what lets a touch drag continue outside the
         * element it started on. jsdom has neither method, hence the guards.
         */
        const target = event.target;

        if (target instanceof HTMLElement && "releasePointerCapture" in target) {
          if (!("hasPointerCapture" in target) || target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
          }
        }

        pressHandlers.onPointerdown(event);
      },
      onPointerenter: (event) => {
        // Dragging a range highlights whatever the pointer passes over. A finger only counts once
        // the drag has actually started, or scrolling past a date would highlight it.
        if (isRangeCalendarState(state) && isSelectable.value) {
          if (event.pointerType !== "touch" || state.isDragging.value) {
            state.highlightDate(date.value);
          }
        }

        pressHandlers.onPointerenter(event);
      },
    },
    isDisabled,
    isFocused,
    isInvalid,
    isOutsideVisibleRange: computed(
      () =>
        date.value.compare(state.visibleRange.value.start) < 0 ||
        date.value.compare(state.visibleRange.value.end) > 0,
    ),
    isPressed,
    isSelected,
    isToday: isDateToday,
    isUnavailable,
  };
};
