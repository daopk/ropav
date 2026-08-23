import type {CalendarRange, DateRange, RangeCalendarLikeState} from "./use-calendar";
import type {SelectionAlignment, UseCalendarStateOptions} from "./use-calendar-state";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";
import type {MaybeRefOrGetter} from "vue";

import {
  GregorianCalendar,
  maxDate,
  minDate,
  toCalendar,
  toCalendarDate,
} from "@internationalized/date";
import {computed, shallowRef, toValue} from "vue";

import {alignCenter, constrainValue, isDateInvalid, previousAvailableDate} from "../utils/calendar";

import {useCalendarState} from "./use-calendar-state";
import {useControllableState} from "./use-controllable-state";
import {useLocale} from "./use-locale";

export interface UseRangeCalendarStateOptions extends Omit<
  UseCalendarStateOptions,
  "defaultValue" | "isDateUnavailable" | "onChange" | "selectionMode" | "value"
> {
  value?: MaybeRefOrGetter<DateRange | null | undefined>;
  defaultValue?: MaybeRefOrGetter<DateRange | null | undefined>;
  onChange?: (value: DateRange | null) => void;
  /**
   * Whether a range may span an unavailable date.
   *
   * Off by default, which is why pinning one end narrows the bounds: a range that jumped over a
   * blocked day would claim dates the caller said were not available.
   */
  allowsNonContiguousRanges?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A plain callback rather than a getter, matching the single calendar: `toValue` cannot tell a
   * predicate from a getter that returns one. The anchor is handed over as well, so the caller can
   * decide what is available from the end the user already pinned.
   */
  isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
}

/** The state behind a range calendar: everything a single one has, plus the pending range. */
export type RangeCalendarState = RangeCalendarLikeState & {
  setValue: (value: DateRange | null) => void;
  /** Drops both the pending anchor and the selected range. */
  clearSelection: () => void;
  /** Ends a half-built range on the focused date, for a pointer released outside the calendar. */
  commitSelection: () => void;
};

/** Order two dates and reduce them to plain dates, which is what a highlighted range is. */
const makeRange = (start: DateValue, end: DateValue): CalendarRange | null => {
  if (!start || !end) return null;

  let from = start;
  let to = end;

  // The user can drag either way, so the anchor is not necessarily the earlier end.
  if (to.compare(from) < 0) [from, to] = [to, from];

  return {end: toCalendarDate(to), start: toCalendarDate(from)};
};

/**
 * Turn one end of the range into the value the owner receives.
 *
 * The calendar on screen must not leak into the value: an end picked in a Buddhist calendar is
 * still emitted in whatever system that end already used, or Gregorian when there was none.
 */
const convertValue = (newValue: CalendarDate, oldValue?: DateValue): DateValue => {
  const converted = toCalendar(newValue, oldValue?.calendar ?? new GregorianCalendar());

  // An end that carried a time keeps it: moving a boundary must not silently reset the clock.
  if (oldValue && "hour" in oldValue) return oldValue.set(converted);

  return converted;
};

/**
 * The last date reachable from the anchor before an unavailable one blocks the way.
 *
 * Searches no further than one visible duration out, so a calendar with nothing unavailable on
 * screen does not walk the whole calendar system to find that out.
 */
const nextUnavailableDate = (
  anchor: CalendarDate,
  isDateUnavailable: (date: CalendarDate) => boolean,
  visibleDuration: DateDuration,
  direction: 1 | -1,
): CalendarDate | undefined => {
  let nextDate = anchor.add({days: direction});
  const lowerBound = anchor.subtract(visibleDuration);
  const upperBound = anchor.add(visibleDuration);

  while (
    (direction < 0 ? nextDate.compare(lowerBound) >= 0 : nextDate.compare(upperBound) <= 0) &&
    !isDateUnavailable(nextDate)
  ) {
    nextDate = nextDate.add({days: direction});
  }

  // Nothing blocked the way inside the search window, so the range is unbounded on this side.
  if (isDateUnavailable(nextDate)) return nextDate.add({days: -direction});

  return undefined;
};

/**
 * The state behind a range calendar: what is on screen, which range is pending, and what is picked.
 *
 * Ported from react-stately's `packages/react-stately/src/calendar/useRangeCalendarState.ts`
 * (react-stately 3.49.0).
 *
 * Built on top of a single calendar's state rather than beside it, exactly as upstream is: the
 * visible range, focus movement and paging are the same behaviour, and only selection differs. The
 * range's own bounds are handed *down* — pinning one end narrows what the inner calendar treats as
 * valid, which is how focus is kept inside the stretch a contiguous range could still cover.
 */
export const useRangeCalendarState = (
  options: UseRangeCalendarStateOptions,
): RangeCalendarState => {
  const resolvedLocale = useLocale();
  const locale = computed(() => toValue(options.locale) ?? resolvedLocale.value.locale);
  const visibleDuration = computed<DateDuration>(
    () => toValue(options.visibleDuration) ?? {months: 1},
  );
  const minValue = computed(() => toValue(options.minValue));
  const maxValue = computed(() => toValue(options.maxValue));

  const {setState: setValue, state: value} = useControllableState<DateRange | null>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  const anchorDate = shallowRef<CalendarDate | null>(null);

  /**
   * Where the visible range sits when the calendar opens on a range it already has.
   *
   * Centred like a single calendar, unless centring would push the selected end past the last
   * visible date — a picker opened on a selected range showing only half of it reads as a bug.
   */
  const alignment = computed<SelectionAlignment>(() => {
    const range = value.value;

    if (!range || !range.start || !range.end) return "center";

    const start = alignCenter(
      toCalendarDate(range.start),
      visibleDuration.value,
      locale.value,
      minValue.value,
      maxValue.value,
    );
    const end = start.add(visibleDuration.value).subtract({days: 1});

    return range.end.compare(end) > 0 ? "start" : "center";
  });

  /*
   * Left `undefined` when the caller passed no predicate, which is not the same as one that always
   * answers false: `previousAvailableDate` walks backwards only when it has a predicate, and
   * otherwise hands the date straight back even from outside the visible range.
   */
  const isDateUnavailableProp = options.isDateUnavailable;
  const isDateUnavailable = isDateUnavailableProp
    ? (date: DateValue) => isDateUnavailableProp(date, anchorDate.value)
    : undefined;

  /** How far a contiguous range could reach from `anchor`, or `null` when nothing limits it. */
  const getAvailableRange = (anchor: CalendarDate | null) => {
    if (!anchor || !isDateUnavailable || toValue(options.allowsNonContiguousRanges)) return null;

    return {
      end: nextUnavailableDate(anchor, isDateUnavailable, visibleDuration.value, 1),
      start: nextUnavailableDate(anchor, isDateUnavailable, visibleDuration.value, -1),
    };
  };

  const availableRange = computed(() => getAvailableRange(anchorDate.value));

  // The tighter of the caller's own bounds and what a contiguous range could reach.
  const min = computed(() => maxDate(minValue.value, availableRange.value?.start));
  const max = computed(() => minDate(maxValue.value, availableRange.value?.end));

  const calendar = useCalendarState({
    autoFocus: options.autoFocus,
    createCalendar: options.createCalendar,
    defaultFocusedValue: options.defaultFocusedValue,
    firstDayOfWeek: options.firstDayOfWeek,
    focusedValue: options.focusedValue,
    isDateUnavailable,
    isDisabled: options.isDisabled,
    isInvalid: options.isInvalid,
    isReadOnly: options.isReadOnly,
    locale: options.locale,
    maxValue: max,
    minValue: min,
    onFocusChange: options.onFocusChange,
    pageBehavior: options.pageBehavior,
    selectionAlignment: () => toValue(options.selectionAlignment) ?? alignment.value,
    /*
     * Controlled on the range's start, so the inner calendar opens where the selection is. Never
     * written to: every setter that could reach it is replaced on the way out.
     */
    value: () => (value.value ? value.value.start : null),
    visibleDuration,
    weeksInMonth: options.weeksInMonth,
  });

  /** The range the user is looking at: the pending one while an end is pinned, else the value. */
  const highlightedRange = computed(() => {
    const anchor = anchorDate.value;

    if (anchor) return makeRange(anchor, calendar.focusedDate.value);

    const range = value.value;

    return range ? makeRange(range.start, range.end) : null;
  });

  const isInvalid = (date: CalendarDate) =>
    calendar.isInvalid(date) ||
    isDateInvalid(date, availableRange.value?.start, availableRange.value?.end);

  const selectDate = (date: CalendarDate) => {
    if (toValue(options.isReadOnly)) return;

    const constrained = constrainValue(date, min.value, max.value);
    const available = previousAvailableDate(
      constrained,
      calendar.visibleRange.value.start,
      isDateUnavailable,
    );

    // The whole stretch back to the first visible date is unavailable, so there is nothing to pick.
    if (!available) return;

    if (!anchorDate.value) {
      anchorDate.value = available;

      return;
    }

    const range = makeRange(anchorDate.value, available);

    if (range) {
      setValue({
        end: convertValue(range.end, value.value?.end),
        start: convertValue(range.start, value.value?.start),
      });
    }

    anchorDate.value = null;
  };

  const isDragging = shallowRef(false);

  /** Whether the selected range is itself out of bounds, as opposed to being called invalid. */
  const isInvalidSelection = computed(() => {
    const range = value.value;

    // Nothing to judge while an end is still being pinned: the range is not the user's answer yet.
    if (!range || anchorDate.value) return false;

    if (isDateUnavailable && (isDateUnavailable(range.start) || isDateUnavailable(range.end))) {
      return true;
    }

    return (
      isDateInvalid(range.start, minValue.value, maxValue.value) ||
      isDateInvalid(range.end, minValue.value, maxValue.value)
    );
  });

  /**
   * Move focus off the end just pinned, so a keyboard user can see the range grow.
   *
   * Forwards by a day where possible, backwards where the range cannot reach forwards, and nowhere
   * at all when neither neighbour is usable.
   */
  const focusNearestAvailableDate = (anchor: CalendarDate) => {
    const range = getAvailableRange(anchor);
    const isUnusable = (date: CalendarDate) =>
      isInvalid(date) || isDateInvalid(date, range?.start, range?.end);
    let nextDay = anchor.add({days: 1});

    if (isUnusable(nextDay)) nextDay = anchor.subtract({days: 1});

    if (!isUnusable(nextDay)) {
      calendar.setFocusedDate(nextDay);
      calendar.setFocused(true);
    }
  };

  return {
    ...calendar,
    anchorDate: computed(() => anchorDate.value),
    clearSelection: () => {
      anchorDate.value = null;
      setValue(null);
    },
    commitSelection: () => selectDate(calendar.focusedDate.value),
    focusNearestAvailableDate,
    highlightDate: (date) => {
      // Only while a range is being built: a bare hover must not move focus.
      if (anchorDate.value) calendar.setFocusedDate(date);
    },
    highlightedRange,
    isDragging: computed(() => isDragging.value),
    isInvalid,
    isSelected: (date) => {
      const range = highlightedRange.value;

      return Boolean(
        range &&
        date.compare(range.start) >= 0 &&
        date.compare(range.end) <= 0 &&
        !calendar.isCellDisabled(date) &&
        !calendar.isCellUnavailable(date),
      );
    },
    isValueInvalid: computed(() => Boolean(toValue(options.isInvalid)) || isInvalidSelection.value),
    selectDate,
    selectFocusedDate: () => {
      if (!calendar.isCellUnavailable(calendar.focusedDate.value)) {
        selectDate(calendar.focusedDate.value);
      }
    },
    setAnchorDate: (date) => {
      anchorDate.value = date;
    },
    setDragging: (dragging) => {
      isDragging.value = dragging;
    },
    setValue,
    value: computed(() => value.value),
  };
};
