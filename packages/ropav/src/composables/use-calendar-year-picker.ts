import type { AnyCalendarState } from "./use-calendar";
import type { CalendarDate } from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { isSameYear, toCalendarDate } from "@internationalized/date";
import { computed, toValue } from "vue";

import { useDateFormatter } from "./use-date-formatter";
import { useDisplayNames } from "./use-display-names";

export interface CalendarYearPickerFormatOptions {
  year?: "numeric" | "2-digit";
  era?: "long" | "short" | "narrow";
}

export interface UseCalendarYearPickerOptions {
  /** How many years to offer. @default 20 */
  visibleYears?: MaybeRefOrGetter<number | undefined>;
  /** Overrides the parts each year is written from. */
  format?: MaybeRefOrGetter<CalendarYearPickerFormatOptions | undefined>;
}

export interface CalendarYearPickerItem {
  /**
   * The item's position in the list, which is also how it is selected.
   *
   * Deliberately not the year number: in the Japanese calendar the era can change with the year, so
   * a year number alone does not identify a date.
   */
  id: number;
  date: CalendarDate;
  formatted: string;
}

export interface UseCalendarYearPickerReturn {
  /** The name of the control, taken from the browser's own word for a year field. */
  ariaLabel: ComputedRef<string | undefined>;
  /** Which item is focused, as an index into `items`. */
  value: ComputedRef<number>;
  onChange: (id: number | null) => void;
  items: ComputedRef<CalendarYearPickerItem[]>;
}

/**
 * A year is read off the calendar date in UTC, the one zone that never skips an hour or a day.
 *
 * A bare date has no zone of its own, so resolving one through the calendar's zone has to pick a
 * moment for it, and midnight is not always available: where a zone drops the end of December 31 —
 * or the whole day, as the ones that crossed the date line did — the moment slides forward into
 * January and the year comes back one too high. Reading and writing the date in the same
 * gapless zone keeps every label the year it was built from.
 */
const LABEL_TIME_ZONE = "UTC";

/**
 * The list of years a calendar can jump to.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useCalendarYearPicker.ts`
 * (react-aria 3.51.0).
 *
 * The window is centred on the focused year and then slid — not clipped — to fit inside the
 * calendar's bounds, so the list is the full count wherever it lands.
 */
export const useCalendarYearPicker = (
  options: UseCalendarYearPickerOptions,
  state: AnyCalendarState,
): UseCalendarYearPickerReturn => {
  const displayNames = useDisplayNames();

  const formatter = useDateFormatter(() => {
    const format = toValue(options.format);
    const focused = state.focusedDate.value;

    return {
      calendar: focused.calendar.identifier,
      era:
        format?.era ||
        (focused.calendar.identifier === "gregory" && focused.era === "BC" ? "short" : undefined),
      timeZone: LABEL_TIME_ZONE,
      year: format?.year || "numeric",
    };
  });

  const bounds = computed(() => {
    const focused = state.focusedDate.value;
    const visibleYears = toValue(options.visibleYears) || 20;

    // An even count has no true middle year, so the focused one sits just past the halfway mark.
    let minDate = focused.subtract({ years: Math.floor(visibleYears / 2) });
    let maxDate = focused.add({ years: Math.ceil(visibleYears / 2) - 1 });

    /*
     * A window that runs past a bound slides back rather than shrinking, so the picker always
     * offers the same number of years — and then clamps again in case the two bounds together are
     * narrower than the window.
     */
    if (state.maxValue.value && maxDate.compare(state.maxValue.value) > 0) {
      maxDate = toCalendarDate(state.maxValue.value);
      minDate = maxDate.subtract({ years: visibleYears - 1 });
    }

    if (state.minValue.value && minDate.compare(state.minValue.value) < 0) {
      minDate = toCalendarDate(state.minValue.value);
      maxDate = minDate.add({ years: visibleYears - 1 });

      if (state.maxValue.value && maxDate.compare(state.maxValue.value) > 0) {
        maxDate = toCalendarDate(state.maxValue.value);
      }
    }

    return { maxDate, minDate };
  });

  const items = computed<CalendarYearPickerItem[]>(() => {
    const { maxDate, minDate } = bounds.value;
    const years: CalendarYearPickerItem[] = [];
    let date = minDate;

    while (date.compare(maxDate) <= 0) {
      years.push({
        date,
        formatted: formatter.value.format(date.toDate(LABEL_TIME_ZONE)),
        id: years.length,
      });
      date = date.add({ years: 1 });
    }

    return years;
  });

  return {
    ariaLabel: computed(() => displayNames.value.of("year")),
    items,
    onChange: (id) => {
      if (id == null) return;

      const item = items.value[id];

      if (item) state.setFocusedDate(item.date);
    },
    value: computed(() => {
      const focused = state.focusedDate.value;
      const index = items.value.findIndex((item) => isSameYear(item.date, focused));

      // The first year stands in when the focused one is not on offer, so the control is never
      // pointing at nothing.
      return index === -1 ? 0 : index;
    }),
  };
};
