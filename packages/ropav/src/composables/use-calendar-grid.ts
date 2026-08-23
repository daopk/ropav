import type { DayOfWeek, WeekdayStyle } from "../utils/calendar";
import type { AnyCalendarState, CalendarShared } from "./use-calendar";
import type { CalendarDate } from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { startOfWeek, today } from "@internationalized/date";
import { computed, toValue } from "vue";

import { isRangeCalendarState, useVisibleRangeDescription } from "./use-calendar";
import { useDateFormatter } from "./use-date-formatter";
import { useLabels } from "./use-labels";
import { useLocale } from "./use-locale";

export interface UseCalendarGridOptions {
  /** The first date this grid shows. Defaults to the first visible date of the calendar. */
  startDate?: MaybeRefOrGetter<CalendarDate | undefined>;
  /** The last date this grid shows. Defaults to the last visible date of the calendar. */
  endDate?: MaybeRefOrGetter<CalendarDate | undefined>;
  /** How wide the weekday names above the grid are written. @default "narrow" */
  weekdayStyle?: MaybeRefOrGetter<WeekdayStyle | undefined>;
  /** The day a week starts on, when it should not follow the locale. */
  firstDayOfWeek?: MaybeRefOrGetter<DayOfWeek | undefined>;
}

export interface UseCalendarGridReturn {
  /** Spread with `v-bind` onto the grid element. Never carries an `on*` key. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** Spread with `v-bind` onto the grid's header row container. */
  headerAttrs: ComputedRef<Record<string, unknown>>;
  onKeydown: (event: KeyboardEvent) => void;
  onFocusin: () => void;
  onFocusout: () => void;
  /** The weekday names for the column headers, in the order the locale writes them. */
  weekDays: ComputedRef<string[]>;
  /** How many week rows this grid has. */
  weeksInMonth: ComputedRef<number>;
}

/**
 * The behaviour and accessibility wiring for one grid of dates.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useCalendarGrid.ts`
 * (react-aria 3.51.0).
 *
 * The grid owns the whole keyboard contract — arrows, paging, Home/End, Enter and Space — because
 * only it knows which way is "next" in the current writing direction.
 */
export const useCalendarGrid = (
  options: UseCalendarGridOptions,
  state: AnyCalendarState,
  shared: CalendarShared,
): UseCalendarGridReturn => {
  const locale = useLocale();
  const startDate = computed(() => toValue(options.startDate) ?? state.visibleRange.value.start);
  const endDate = computed(() => toValue(options.endDate) ?? state.visibleRange.value.end);

  const visibleRangeDescription = useVisibleRangeDescription(
    startDate,
    endDate,
    () => state.timeZone.value,
    true,
  );

  const labels = useLabels(() => ({
    "aria-label": [shared.ariaLabel.value, visibleRangeDescription.value]
      .filter(Boolean)
      .join(", "),
    "aria-labelledby": shared.ariaLabelledBy.value,
  }));

  /**
   * Keys that must keep working while held down: paging and stepping are what a user holds.
   *
   * Selecting is in here too, which is upstream's choice — holding Enter re-selects the same date,
   * which is harmless because selecting is idempotent.
   */
  const repeatable: Record<string, () => void> = {
    " ": () => state.selectFocusedDate(),
    ArrowDown: () => state.focusNextRow(),
    ArrowLeft: () => {
      // Left is backwards only in a left-to-right calendar.
      if (locale.value.direction === "rtl") state.focusNextDay();
      else state.focusPreviousDay();
    },
    ArrowRight: () => {
      if (locale.value.direction === "rtl") state.focusPreviousDay();
      else state.focusNextDay();
    },
    ArrowUp: () => state.focusPreviousRow(),
    Enter: () => state.selectFocusedDate(),
    PageDown: () => state.focusNextSection(),
    PageUp: () => state.focusPreviousSection(),
    "Shift+PageDown": () => state.focusNextSection(true),
    "Shift+PageUp": () => state.focusPreviousSection(true),
  };

  /** Keys that act once per press. */
  const single: Record<string, () => boolean> = {
    End: () => {
      state.focusSectionEnd();

      return true;
    },
    Escape: () => {
      // Abandons a half-built range. Reported as unhandled either way, so a dialog above still
      // gets its chance to close.
      if (isRangeCalendarState(state)) state.setAnchorDate(null);

      return false;
    },
    Home: () => {
      state.focusSectionStart();

      return true;
    },
  };

  const onKeydown = (event: KeyboardEvent) => {
    const modifier = event.shiftKey ? "Shift+" : "";
    const withModifiers = `${modifier}${event.key}`;

    // Exact modifier match, as upstream requires: Alt+ArrowLeft belongs to the browser's history.
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const repeat = repeatable[withModifiers];

    if (repeat) {
      // A held key keeps stepping; composition is a different keystroke entirely.
      if (!event.isComposing) {
        repeat();
        event.preventDefault();
        event.stopPropagation();
      }

      return;
    }

    if (event.shiftKey || event.repeat || event.isComposing) return;

    const handler = single[event.key];

    if (!handler) return;

    if (handler()) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const dayFormatter = useDateFormatter(() => ({
    timeZone: state.timeZone.value,
    weekday: toValue(options.weekdayStyle) || "narrow",
  }));

  const weekDays = computed(() => {
    const duration = state.visibleDuration.value;
    const isDayView = Boolean(duration.days && duration.days < 7);
    const firstDayOfWeek = toValue(options.firstDayOfWeek);
    // A day view labels the days it actually shows; a week or month view labels a generic week.
    const weekStart = isDayView
      ? startDate.value
      : startOfWeek(today(state.timeZone.value), locale.value.locale, firstDayOfWeek);
    const days = isDayView ? duration.days! : 7;

    return Array.from({ length: days }, (_, index) =>
      dayFormatter.value.format(weekStart.add({ days: index }).toDate(state.timeZone.value)),
    );
  });

  return {
    attrs: computed(() => ({
      ...labels.value,
      "aria-disabled": state.isDisabled.value || undefined,
      "aria-multiselectable":
        isRangeCalendarState(state) || state.selectionMode?.value === "multiple" || undefined,
      "aria-readonly": state.isReadOnly.value || undefined,
      role: "grid",
    })),
    headerAttrs: computed(() => ({
      // The weekday names are already part of every cell's own label, so announcing the column
      // headers as well would read each date's weekday twice.
      "aria-hidden": true,
    })),
    onFocusin: () => state.setFocused(true),
    onFocusout: () => state.setFocused(false),
    onKeydown,
    weekDays,
    weeksInMonth: computed(() => state.getWeeksInMonth(startDate.value)),
  };
};
