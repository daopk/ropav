import type { DayOfWeek } from "../utils/calendar";
import type {
  Calendar,
  CalendarDate,
  CalendarIdentifier,
  DateDuration,
  DateValue,
} from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import {
  DateFormatter,
  GregorianCalendar,
  endOfMonth,
  endOfWeek,
  getDayOfWeek,
  getWeeksInMonth,
  isEqualCalendar,
  isSameDay,
  startOfMonth,
  startOfWeek,
  toCalendar,
  toCalendarDate,
  today,
} from "@internationalized/date";
import { computed, shallowRef, toValue, watch } from "vue";

import {
  alignCenter,
  alignEnd,
  alignStart,
  constrainStart,
  constrainValue,
  isDateInvalid,
  isEqualDuration,
  previousAvailableDate,
} from "../utils/calendar";

import { useControllableState } from "./use-controllable-state";
import { useLocale } from "./use-locale";

/** Whether the calendar takes one date or a set of them. */
export type CalendarSelectionMode = "single" | "multiple";

/** How far the previous/next buttons move: a whole visible range, or one unit of it. */
export type PageBehavior = "single" | "visible";

/** Where the focused date sits inside the visible range when the calendar first opens. */
export type SelectionAlignment = "start" | "center" | "end";

/** The value a calendar carries, which is a list when it selects more than one date. */
export type CalendarValue = DateValue | DateValue[] | null;

export interface UseCalendarStateOptions {
  value?: MaybeRefOrGetter<CalendarValue | undefined>;
  defaultValue?: MaybeRefOrGetter<CalendarValue | undefined>;
  onChange?: (value: CalendarValue) => void;
  /** Whether the calendar takes one date or several. @default "single" */
  selectionMode?: MaybeRefOrGetter<CalendarSelectionMode | undefined>;
  minValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  maxValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A plain callback rather than a getter: `toValue` cannot tell a predicate from a getter that
   * returns one, so it would invoke the predicate with no date and use whatever came back.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the calendar takes focus as soon as it mounts. */
  autoFocus?: MaybeRefOrGetter<boolean | undefined>;
  focusedValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  defaultFocusedValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  onFocusChange?: (date: CalendarDate) => void;
  /** How much is on screen at once, which is also what paging moves by. @default {months: 1} */
  visibleDuration?: MaybeRefOrGetter<DateDuration | undefined>;
  /** @default "visible" */
  pageBehavior?: MaybeRefOrGetter<PageBehavior | undefined>;
  /** @default "center" */
  selectionAlignment?: MaybeRefOrGetter<SelectionAlignment | undefined>;
  /** The day a week starts on, when it should not follow the locale. */
  firstDayOfWeek?: MaybeRefOrGetter<DayOfWeek | undefined>;
  /** A fixed number of week rows, so a month grid does not change height. */
  weeksInMonth?: MaybeRefOrGetter<number | undefined>;
  /** Overrides the locale in force, for a calendar that must not follow its surroundings. */
  locale?: MaybeRefOrGetter<string | undefined>;
  /** Builds the calendar system for an identifier. Injectable so a build can ship fewer of them. */
  createCalendar: (identifier: CalendarIdentifier) => Calendar;
}

export interface CalendarState {
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  /** The selected date, or every selected date when the calendar takes more than one. */
  value: ComputedRef<CalendarDate | CalendarDate[] | null>;
  selectionMode: ComputedRef<CalendarSelectionMode>;
  visibleDuration: ComputedRef<DateDuration>;
  /** The first and last date on screen. */
  visibleRange: ComputedRef<{ start: CalendarDate; end: CalendarDate }>;
  minValue: ComputedRef<DateValue | null | undefined>;
  maxValue: ComputedRef<DateValue | null | undefined>;
  focusedDate: ComputedRef<CalendarDate>;
  timeZone: ComputedRef<string>;
  isValueInvalid: ComputedRef<boolean>;
  isFocused: ComputedRef<boolean>;
  /** The day a week starts on here, or `undefined` to follow the locale. */
  firstDayOfWeek: ComputedRef<DayOfWeek | undefined>;
  setValue: (value: CalendarDate | CalendarDate[] | null) => void;
  setFocusedDate: (date: CalendarDate) => void;
  setFocused: (value: boolean) => void;
  focusNextDay: () => void;
  focusPreviousDay: () => void;
  focusNextRow: () => void;
  focusPreviousRow: () => void;
  focusNextPage: () => void;
  focusPreviousPage: () => void;
  focusSectionStart: () => void;
  focusSectionEnd: () => void;
  focusNextSection: (larger?: boolean) => void;
  focusPreviousSection: (larger?: boolean) => void;
  selectFocusedDate: () => void;
  selectDate: (date: CalendarDate) => void;
  isInvalid: (date: CalendarDate) => boolean;
  isSelected: (date: CalendarDate) => boolean;
  isCellFocused: (date: CalendarDate) => boolean;
  isCellDisabled: (date: CalendarDate) => boolean;
  isCellUnavailable: (date: CalendarDate) => boolean;
  isPreviousVisibleRangeInvalid: () => boolean;
  isNextVisibleRangeInvalid: () => boolean;
  /** The seven dates of a week row, with `null` where the calendar system runs out. */
  getDatesInWeek: (weekIndex: number, from?: CalendarDate) => (CalendarDate | null)[];
  getWeeksInMonth: (date?: CalendarDate) => number;
}

/** One of each unit the duration spans, which is what "page by a single unit" means. */
const unitDuration = (duration: DateDuration): DateDuration => {
  const unit: Record<string, number> = {};

  for (const key of Object.keys(duration)) unit[key] = 1;

  return unit as DateDuration;
};

/**
 * The state behind a calendar: what is on screen, what is selected, and where focus moves.
 *
 * Ported from react-stately's `packages/react-stately/src/calendar/useCalendarState.ts`
 * (react-stately 3.49.0).
 *
 * The focused date and the visible range are separate pieces of state that have to agree, and
 * keeping them in agreement is most of this file. React does it by calling setState during render
 * and letting the render restart until the two settle; the `normalize` watcher below is that same
 * loop, run synchronously so a caller never observes a half-corrected pair.
 */
export const useCalendarState = (options: UseCalendarStateOptions): CalendarState => {
  const { createCalendar, isDateUnavailable, onFocusChange } = options;
  const resolvedLocale = useLocale();
  const locale = computed(() => toValue(options.locale) ?? resolvedLocale.value.locale);

  const resolvedOptions = computed(() => new DateFormatter(locale.value).resolvedOptions());
  const calendar = computed(() =>
    createCalendar(resolvedOptions.value.calendar as CalendarIdentifier),
  );

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const minValue = computed(() => toValue(options.minValue));
  const maxValue = computed(() => toValue(options.maxValue));
  const selectionMode = computed<CalendarSelectionMode>(
    () => toValue(options.selectionMode) ?? "single",
  );
  const visibleDuration = computed<DateDuration>(
    () => toValue(options.visibleDuration) ?? { months: 1 },
  );
  const pageBehavior = computed<PageBehavior>(() => toValue(options.pageBehavior) ?? "visible");
  const firstDayOfWeek = computed(() => toValue(options.firstDayOfWeek));

  const { setState: setControlledValue, state: value } = useControllableState<CalendarValue>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  const calendarDateValue = computed(() => {
    const current = value.value;

    if (Array.isArray(current)) {
      return current.map((entry) => toCalendar(toCalendarDate(entry), calendar.value));
    }

    return current ? toCalendar(toCalendarDate(current), calendar.value) : null;
  });

  const timeZone = computed(() => {
    const current = value.value;
    const first = Array.isArray(current) ? current[0] : current;

    return first && "timeZone" in first ? first.timeZone : resolvedOptions.value.timeZone;
  });

  const focusedCalendarDate = computed(() => {
    const focused = toValue(options.focusedValue);

    return focused
      ? constrainValue(
          toCalendar(toCalendarDate(focused), calendar.value),
          minValue.value,
          maxValue.value,
        )
      : undefined;
  });

  /**
   * Where focus starts: an explicit default, else the selection, else today.
   *
   * Read once at setup, because React holds it in `useState` — a later change to the selection
   * must not drag focus back to it while the user is navigating.
   */
  const initialFocusedDate = (() => {
    const requested = toValue(options.defaultFocusedValue);

    if (requested) {
      return constrainValue(
        toCalendar(toCalendarDate(requested), calendar.value),
        minValue.value,
        maxValue.value,
      );
    }

    const selected = calendarDateValue.value;

    if (selected) {
      return constrainValue(
        Array.isArray(selected) ? selected[0]! : selected,
        minValue.value,
        maxValue.value,
      );
    }

    return constrainValue(
      toCalendar(today(timeZone.value), calendar.value),
      minValue.value,
      maxValue.value,
    );
  })();

  const { setState: setFocusedDateState, state: focusedDate } = useControllableState<CalendarDate>({
    defaultValue: initialFocusedDate,
    onValueChange: onFocusChange,
    value: () => focusedCalendarDate.value,
  });

  const alignFor = (date: CalendarDate) => {
    const duration = visibleDuration.value;
    const args = [duration, locale.value, minValue.value, maxValue.value] as const;

    switch (toValue(options.selectionAlignment)) {
      case "start":
        return alignStart(date, ...args);
      case "end":
        return alignEnd(date, ...args);
      default:
        return alignCenter(date, ...args);
    }
  };

  const startDate = shallowRef(alignFor(focusedDate.value));
  const isFocusedState = shallowRef(Boolean(toValue(options.autoFocus)));

  const endDate = computed(() => {
    const duration: DateDuration = { ...visibleDuration.value };

    // The range is inclusive, so the last visible date is one day short of the whole duration.
    if (duration.days) duration.days--;
    else duration.days = -1;

    return startDate.value.add(duration);
  });

  /*
   * Mirrors of the inputs the last correction ran against, so a change can be told from a re-run.
   * React keeps these in `useState` and compares during render; here they are plain locals because
   * nothing reads them but the watcher below.
   */
  let lastVisibleDuration = visibleDuration.value;
  let lastCalendar = calendar.value;

  /*
   * Held while paging writes both the focused date and the visible range, so nothing observes the
   * pair mid-write. React batches its two `setState` calls into one re-render and therefore never
   * publishes a half-moved calendar; the correction below converges to the same answer either way,
   * but without this a component watching `visibleRange` would see a range aligned to a focused
   * date that is about to be replaced.
   */
  let isBatching = false;

  /**
   * Bring the visible range and the focused date back into agreement.
   *
   * Reads every input once at the top and writes once at the bottom, exactly as one React render
   * would, and re-runs when its own writes change something — which is how the two settle. Runs
   * synchronously so `visibleRange` is never read mid-correction.
   */
  const normalize = () => {
    if (isBatching) return;

    const storedStart = startDate.value;
    const storedFocused = focusedDate.value;
    const storedEnd = endDate.value;
    const duration = visibleDuration.value;
    const currentCalendar = calendar.value;
    const min = minValue.value;
    const max = maxValue.value;

    let nextStart = storedStart;
    let nextFocused = storedFocused;

    if (!isEqualDuration(duration, lastVisibleDuration)) {
      lastVisibleDuration = duration;
      nextStart = alignFor(storedFocused);
    }

    // A new calendar system renumbers everything, so focus and the range are both rebuilt in it.
    if (!isEqualCalendar(currentCalendar, lastCalendar)) {
      const converted = toCalendar(storedFocused, currentCalendar);

      nextStart = alignCenter(converted, duration, locale.value, min, max);
      nextFocused = converted;
      lastCalendar = currentCalendar;
    }

    if (isDateInvalid(storedFocused, min, max)) {
      // Focus cannot rest outside the range, so pull it in rather than paging to reach it.
      nextFocused = constrainValue(storedFocused, min, max);
    } else if (storedFocused.compare(storedStart) < 0) {
      nextStart = alignEnd(storedFocused, duration, locale.value, min, max);
    } else if (storedFocused.compare(storedEnd) > 0) {
      nextStart = alignStart(storedFocused, duration, locale.value, min, max);
    }

    if (nextStart !== storedStart) startDate.value = nextStart;
    if (nextFocused !== storedFocused) setFocusedDateState(nextFocused);
  };

  watch(
    [focusedDate, startDate, calendar, visibleDuration, locale, minValue, maxValue],
    normalize,
    { flush: "sync", immediate: true },
  );

  const focusCell = (date: CalendarDate) => {
    setFocusedDateState(constrainValue(date, minValue.value, maxValue.value));
  };

  /**
   * Turn a cell date into the value the owner receives.
   *
   * The calendar on screen must not leak into the value: a date picked in a Buddhist calendar is
   * still emitted in whatever system the existing value used, or Gregorian when there is none.
   */
  const normalizeValue = (newValue: CalendarDate): DateValue | null => {
    const constrained = constrainValue(newValue, minValue.value, maxValue.value);
    const previous = previousAvailableDate(constrained, startDate.value, isDateUnavailable);

    if (!previous) return null;

    const current = value.value;
    const baseValue = Array.isArray(current) ? current[0] : current;
    const calendarValue = toCalendar(previous, baseValue?.calendar ?? new GregorianCalendar());

    // A value that carried a time keeps it: picking a day must not silently reset the clock.
    if (baseValue && "hour" in baseValue) return baseValue.set(calendarValue);

    return calendarValue;
  };

  const setValue = (newValue: CalendarDate | CalendarDate[] | null) => {
    if (isDisabled.value || isReadOnly.value) return;

    if (newValue === null) {
      setControlledValue(selectionMode.value === "multiple" ? [] : null);

      return;
    }

    if (Array.isArray(newValue)) {
      setControlledValue(newValue.map(normalizeValue).filter(Boolean) as DateValue[]);

      return;
    }

    const localValue = normalizeValue(newValue);

    if (localValue) setControlledValue(localValue);
  };

  const isInvalid = (date: CalendarDate) => isDateInvalid(date, minValue.value, maxValue.value);

  const isCellUnavailable = (date: CalendarDate) =>
    isDateUnavailable ? isDateUnavailable(date) : false;

  const isCellDisabled = (date: CalendarDate) =>
    isDisabled.value ||
    date.compare(startDate.value) < 0 ||
    date.compare(endDate.value) > 0 ||
    isInvalid(date);

  const isSelected = (date: CalendarDate) => {
    const selected = calendarDateValue.value;

    if (!selected || isCellDisabled(date) || isCellUnavailable(date)) return false;

    return Array.isArray(selected)
      ? selected.some((entry) => isSameDay(entry, date))
      : isSameDay(date, selected);
  };

  const isUnavailable = computed(() => {
    const selected = calendarDateValue.value;

    if (!selected) return false;

    if (Array.isArray(selected)) {
      return selected.some(
        (date) => isDateUnavailable?.(date) || isDateInvalid(date, minValue.value, maxValue.value),
      );
    }

    return Boolean(
      isDateUnavailable?.(selected) || isDateInvalid(selected, minValue.value, maxValue.value),
    );
  });

  const isValueInvalid = computed(() => Boolean(toValue(options.isInvalid)) || isUnavailable.value);

  const pageDuration = computed(() =>
    pageBehavior.value === "visible" ? visibleDuration.value : unitDuration(visibleDuration.value),
  );

  const focusPage = (direction: 1 | -1) => {
    const duration = pageDuration.value;
    const previousFocused = focusedDate.value;
    const start =
      direction === 1 ? startDate.value.add(duration) : startDate.value.subtract(duration);
    const focused =
      direction === 1 ? previousFocused.add(duration) : previousFocused.subtract(duration);

    isBatching = true;

    try {
      setFocusedDateState(constrainValue(focused, minValue.value, maxValue.value));
      startDate.value = alignStart(
        // Constrained around the focused date from *before* the move, as upstream does — both are
        // inside the bounds by construction, so which one is passed cannot change the answer.
        constrainStart(
          previousFocused,
          start,
          duration,
          locale.value,
          minValue.value,
          maxValue.value,
        ),
        duration,
        locale.value,
      );
    } finally {
      isBatching = false;
    }

    normalize();
  };

  const focusNextPage = () => focusPage(1);
  const focusPreviousPage = () => focusPage(-1);

  const focusNextRow = () => {
    const duration = visibleDuration.value;

    // A day view has no row below the one on screen, so the whole page moves instead.
    if (duration.days) focusNextPage();
    else if (duration.weeks || duration.months || duration.years) {
      focusCell(focusedDate.value.add({ weeks: 1 }));
    }
  };

  const focusPreviousRow = () => {
    const duration = visibleDuration.value;

    if (duration.days) focusPreviousPage();
    else if (duration.weeks || duration.months || duration.years) {
      focusCell(focusedDate.value.subtract({ weeks: 1 }));
    }
  };

  const focusSectionStart = () => {
    const duration = visibleDuration.value;

    if (duration.days) focusCell(startDate.value);
    else if (duration.weeks) focusCell(startOfWeek(focusedDate.value, locale.value));
    else if (duration.months || duration.years) focusCell(startOfMonth(focusedDate.value));
  };

  const focusSectionEnd = () => {
    const duration = visibleDuration.value;

    if (duration.days) focusCell(endDate.value);
    else if (duration.weeks) focusCell(endOfWeek(focusedDate.value, locale.value));
    else if (duration.months || duration.years) focusCell(endOfMonth(focusedDate.value));
  };

  const focusSection = (direction: 1 | -1, larger?: boolean) => {
    const duration = visibleDuration.value;
    const step = (amount: DateDuration) =>
      focusCell(
        direction === 1 ? focusedDate.value.add(amount) : focusedDate.value.subtract(amount),
      );

    if (!larger && !duration.days) {
      step(unitDuration(duration));

      return;
    }

    if (duration.days) {
      if (direction === 1) focusNextPage();
      else focusPreviousPage();
    } else if (duration.weeks) {
      step({ months: 1 });
    } else if (duration.months || duration.years) {
      step({ years: 1 });
    }
  };

  const selectDate = (date: CalendarDate) => {
    if (isDisabled.value || isReadOnly.value) return;

    if (selectionMode.value !== "multiple") {
      setValue(date);

      return;
    }

    const newDate = normalizeValue(date);

    if (!newDate) return;

    const current = value.value;
    const baseValue: DateValue[] = Array.isArray(current)
      ? current
      : current != null
        ? [current]
        : [];
    const index = baseValue.findIndex((entry) => isSameDay(entry, newDate));

    // Selecting a date that is already in the set removes it, which is how a multi-select toggles.
    setControlledValue(
      index >= 0
        ? baseValue.slice(0, index).concat(baseValue.slice(index + 1))
        : [...baseValue, newDate],
    );
  };

  return {
    firstDayOfWeek,
    focusNextDay: () => focusCell(focusedDate.value.add({ days: 1 })),
    focusNextPage,
    focusNextRow,
    focusNextSection: (larger) => focusSection(1, larger),
    focusPreviousDay: () => focusCell(focusedDate.value.subtract({ days: 1 })),
    focusPreviousPage,
    focusPreviousRow,
    focusPreviousSection: (larger) => focusSection(-1, larger),
    focusSectionEnd,
    focusSectionStart,
    focusedDate: computed(() => focusedDate.value),
    getDatesInWeek: (weekIndex, from = startDate.value) => {
      let date = from.add({ weeks: weekIndex });
      const dates: (CalendarDate | null)[] = [];
      const duration = visibleDuration.value;
      const days = duration.days && duration.days < 7 ? duration.days : 7;

      if (days === 7) {
        date = startOfWeek(date, locale.value, firstDayOfWeek.value);

        /*
         * `startOfWeek` clamps to the calendar system's own first date, which can fall mid-week.
         * The missing days become nulls so the row still lines up under the weekday names.
         */
        const dayOfWeek = getDayOfWeek(date, locale.value, firstDayOfWeek.value);

        for (let index = 0; index < dayOfWeek; index++) dates.push(null);
      }

      while (dates.length < days) {
        dates.push(date);
        const nextDate = date.add({ days: 1 });

        // The calendar system ends here, so the rest of the row is empty.
        if (isSameDay(date, nextDate)) break;

        date = nextDate;
      }

      while (dates.length < days) dates.push(null);

      return dates;
    },
    getWeeksInMonth: (date = startDate.value) => {
      const duration = visibleDuration.value;
      let weeks =
        toValue(options.weeksInMonth) || getWeeksInMonth(date, locale.value, firstDayOfWeek.value);

      if (duration.weeks || duration.days) {
        weeks = duration.weeks ?? 0;
        if (duration.days) weeks += Math.ceil(duration.days / 7);
      }

      return weeks;
    },
    isCellDisabled,
    isCellFocused: (date) => isFocusedState.value && isSameDay(date, focusedDate.value),
    isCellUnavailable,
    isDisabled,
    isFocused: computed(() => isFocusedState.value),
    isInvalid,
    isNextVisibleRangeInvalid: () => {
      // Adding can return the same date at the end of the calendar system, e.g. 9999-12-31.
      const next = endDate.value.add({ days: 1 });

      return isSameDay(next, endDate.value) || isInvalid(next);
    },
    isPreviousVisibleRangeInvalid: () => {
      const previous = startDate.value.subtract({ days: 1 });

      return isSameDay(previous, startDate.value) || isInvalid(previous);
    },
    isReadOnly,
    isSelected,
    isValueInvalid,
    maxValue,
    minValue,
    selectDate,
    selectFocusedDate: () => {
      if (!isDateUnavailable?.(focusedDate.value)) selectDate(focusedDate.value);
    },
    selectionMode,
    setFocused: (next) => {
      isFocusedState.value = next;
    },
    setFocusedDate: focusCell,
    setValue,
    timeZone,
    value: computed(() => calendarDateValue.value),
    visibleDuration,
    visibleRange: computed(() => ({ end: endDate.value, start: startDate.value })),
  };
};
