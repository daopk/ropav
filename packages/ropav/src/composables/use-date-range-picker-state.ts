import type { FieldOptions, FormatterOptions, Granularity, TimeValue } from "../utils/date-format";
import type { DateRange } from "./use-calendar";
import type { FormValidationState, ValidationBehavior } from "./use-form-validation-state";
import type { OverlayTriggerState } from "./use-overlay-trigger-state";
import type { DateValue } from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { DateFormatter, toCalendarDate, toCalendarDateTime } from "@internationalized/date";
import { computed, shallowRef, toValue } from "vue";

import { getFormatOptions, getPlaceholderTime } from "../utils/date-format";
import { getRangeValidationResult } from "../utils/date-validation";

import { useControllableState } from "./use-controllable-state";
import { useDefaultDateProps } from "./use-default-date-props";
import { useFormValidationState } from "./use-form-validation-state";
import { useOverlayTriggerState } from "./use-overlay-trigger-state";

/** A range where either end may still be missing, which is what a half-typed range looks like. */
export interface PartialDateRange {
  start: DateValue | null;
  end: DateValue | null;
}

/** The time halves of a range, held apart from the dates until both are known. */
export interface PartialTimeRange {
  start: TimeValue | null;
  end: TimeValue | null;
}

export interface UseDateRangePickerStateOptions {
  value?: MaybeRefOrGetter<DateRange | null | undefined>;
  defaultValue?: MaybeRefOrGetter<DateRange | null | undefined>;
  onChange?: (value: DateRange | null) => void;
  /** The date the empty segments stand on, which is also where the calendar opens. */
  placeholderValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  minValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  maxValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  /**
   * Rules a date out even though it is inside the range.
   *
   * A plain callback rather than a getter: `toValue` cannot tell a predicate from a getter that
   * returns one, so it would invoke the predicate with no date and use whatever came back.
   */
  isDateUnavailable?: (date: DateValue) => boolean;
  granularity?: MaybeRefOrGetter<Granularity | undefined>;
  hourCycle?: MaybeRefOrGetter<12 | 24 | undefined>;
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>;
  shouldForceLeadingZeros?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: (value: DateRange | null) => string | string[] | true | null | undefined;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /** Name the start of the range is submitted under. */
  startName?: MaybeRefOrGetter<string | undefined>;
  endName?: MaybeRefOrGetter<string | undefined>;
  /** Whether the popover closes as soon as a range is picked. @default true */
  shouldCloseOnSelect?: MaybeRefOrGetter<boolean | (() => boolean) | undefined>;
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface DateRangePickerState extends OverlayTriggerState, FormValidationState {
  /**
   * The range on screen, which is not the same as the value the caller owns: the two ends are
   * typed one at a time, and only a complete range is ever emitted.
   */
  value: ComputedRef<PartialDateRange>;
  defaultValue: ComputedRef<DateRange | null>;
  setValue: (value: PartialDateRange | null) => void;
  /**
   * The date half of the range, which can be set before the time half is.
   *
   * A range of days and a range of times are picked in either order — the calendar answers one, the
   * fields the other — so each half is held on its own until both are known.
   */
  dateRange: ComputedRef<PartialDateRange | null>;
  setDateRange: (value: PartialDateRange) => void;
  timeRange: ComputedRef<PartialTimeRange | null>;
  setTimeRange: (value: PartialTimeRange) => void;
  /** Sets the date half of one end, leaving the other alone. */
  setDate: (part: "start" | "end", value: DateValue | null) => void;
  setTime: (part: "start" | "end", value: TimeValue | null) => void;
  /** Sets one end outright, date and time together, which is what a field reports. */
  setDateTime: (part: "start" | "end", value: DateValue | null) => void;
  granularity: ComputedRef<Granularity>;
  /** Whether this picker takes times as well as dates. */
  hasTime: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  /** Both ends written out for a screen reader, or `null` while the range is incomplete. */
  formatValue: (
    locale: string,
    fieldOptions: FieldOptions,
  ) => { start: string; end: string } | null;
  getDateFormatter: (locale: string, formatOptions: FormatterOptions) => DateFormatter;
}

const EMPTY: PartialDateRange = Object.freeze({ end: null, start: null });

const isComplete = (range: PartialDateRange | null): range is DateRange =>
  range?.start != null && range.end != null;

const isCompleteTime = (
  range: PartialTimeRange | null,
): range is { start: TimeValue; end: TimeValue } => range?.start != null && range.end != null;

/**
 * The state behind a date range picker: the two ends of the range, whether the popover is open, and
 * how the dates and the times are assembled into one value.
 *
 * Ported from react-stately's `packages/react-stately/src/datepicker/useDateRangePickerState.ts`
 * (react-stately 3.49.0).
 *
 * Two things separate this from a single picker. The value the caller owns is only ever a complete
 * range, so a half-typed one is held here instead and emitted as `null` — which is why what is on
 * screen and what has been emitted are two different things. And the picker owns the validation for
 * both fields inside it: they report through this state rather than each reaching a verdict about
 * one end in isolation.
 */
export const useDateRangePickerState = (
  options: UseDateRangePickerStateOptions,
): DateRangePickerState => {
  const overlay = useOverlayTriggerState({
    defaultOpen: options.defaultOpen,
    isOpen: () => toValue(options.isOpen),
    onOpenChange: options.onOpenChange,
  });

  const { setState: setControlledValue, state: controlledValue } =
    useControllableState<DateRange | null>({
      defaultValue: toValue(options.defaultValue) ?? null,
      onValueChange: options.onChange,
      value: () => toValue(options.value),
    });

  // Read once at setup, as React holds it in `useState`: a later change must not rewrite what the
  // fields were reset to.
  const initialValue = controlledValue.value;

  /**
   * The half-typed range, kept here because the caller only ever sees a complete one.
   *
   * Cleared when the value is taken away, so a picker reset from outside does not go on showing the
   * range it used to hold.
   */
  const pending = shallowRef<PartialDateRange>(controlledValue.value ?? EMPTY);

  const value = computed<PartialDateRange>(() => {
    const current = controlledValue.value;

    if (current) return current;
    if (pending.value.start && pending.value.end) return EMPTY;

    return pending.value;
  });

  const setValue = (next: PartialDateRange | null) => {
    pending.value = next ?? EMPTY;
    setControlledValue(isComplete(pending.value) ? pending.value : null);
  };

  /** Whatever end the picker can learn its shape from, even before anything is chosen. */
  const shape = computed(
    () => value.value.start || value.value.end || toValue(options.placeholderValue) || null,
  );
  const { defaultTimeZone, granularity } = useDefaultDateProps(shape, () =>
    toValue(options.granularity),
  );

  const hasTime = computed(
    () =>
      granularity.value === "hour" ||
      granularity.value === "minute" ||
      granularity.value === "second",
  );

  /*
   * The two halves of a pending range. Each is held on its own so the calendar and the time fields
   * can be used in either order; a committed range supersedes both.
   */
  const pendingDates = shallowRef<PartialDateRange | null>(null);
  const pendingTimes = shallowRef<PartialTimeRange | null>(null);

  const dateRange = computed<PartialDateRange | null>(() =>
    isComplete(value.value) ? value.value : pendingDates.value,
  );

  /*
   * A committed range takes over only when it actually carries times. Picking days for a date-only
   * picker leaves times typed earlier standing, which is what lets the two halves be assembled in
   * either order — and is exactly what upstream does.
   */
  const timeRange = computed<PartialTimeRange | null>(() => {
    const current = value.value;

    if (isComplete(current) && "hour" in current.start) {
      return current as unknown as PartialTimeRange;
    }

    return pendingTimes.value;
  });

  const showEra = computed(
    () =>
      (value.value.start?.calendar.identifier === "gregory" && value.value.start.era === "BC") ||
      (value.value.end?.calendar.identifier === "gregory" && value.value.end.era === "BC"),
  );

  const formatOpts = computed<FormatterOptions>(() => ({
    granularity: granularity.value,
    hideTimeZone: toValue(options.hideTimeZone),
    hourCycle: toValue(options.hourCycle),
    shouldForceLeadingZeros: toValue(options.shouldForceLeadingZeros),
    showEra: showEra.value,
    timeZone: defaultTimeZone.value,
  }));

  const validation = useFormValidationState<DateRange | null>({
    builtinValidation: computed(() =>
      getRangeValidationResult(
        value.value,
        toValue(options.minValue),
        toValue(options.maxValue),
        options.isDateUnavailable,
        formatOpts.value,
      ),
    ),
    isInvalid: () => toValue(options.isInvalid),
    // Both names, so a server error keyed to either end reaches this one state.
    name: () => [toValue(options.startName), toValue(options.endName)].filter(Boolean) as string[],
    // Read through a getter, never handed over bare: `toValue` cannot tell a function-valued
    // option from a getter, and would call the validator here with no argument.
    validate: () => options.validate,
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => controlledValue.value,
  });

  /** Whether picking a range should close the popover, which the caller may decide per press. */
  const shouldCloseOnSelect = () => {
    const requested = toValue(options.shouldCloseOnSelect) ?? true;

    return typeof requested === "function" ? requested() : requested;
  };

  const placeholderTime = () => getPlaceholderTime(toValue(options.placeholderValue));

  const commitValue = (dates: DateRange, times: { start: TimeValue; end: TimeValue }) => {
    // A zoned time keeps its own zone and offset, so the date is folded into it rather than the
    // other way round.
    setValue({
      end:
        "timeZone" in times.end
          ? times.end.set(toCalendarDate(dates.end))
          : toCalendarDateTime(dates.end, times.end),
      start:
        "timeZone" in times.start
          ? times.start.set(toCalendarDate(dates.start))
          : toCalendarDateTime(dates.start, times.start),
    });
    pendingDates.value = null;
    pendingTimes.value = null;
    validation.commitValidation();
  };

  /**
   * Take a range of days from the calendar without disturbing the times.
   *
   * The calendar only knows about days, so committing its answer directly would reset the clock on
   * a range that already had one.
   */
  const setDateRange = (range: PartialDateRange) => {
    const shouldClose = shouldCloseOnSelect();
    const times = timeRange.value;

    if (hasTime.value) {
      // Closing immediately means there is no chance to pick a time, so placeholders stand in.
      if (isComplete(range) && (shouldClose || (times?.start && times.end))) {
        commitValue(range, {
          end: times?.end ?? placeholderTime(),
          start: times?.start ?? placeholderTime(),
        });
      } else {
        pendingDates.value = range;
      }
    } else if (isComplete(range)) {
      setValue(range);
      validation.commitValidation();
    } else {
      pendingDates.value = range;
    }

    if (shouldClose) overlay.setOpen(false);
  };

  const setTimeRange = (range: PartialTimeRange) => {
    const dates = dateRange.value;

    if (isComplete(dates) && isCompleteTime(range)) commitValue(dates, range);
    else pendingTimes.value = range;
  };

  return {
    ...validation,
    ...overlay,
    dateRange,
    defaultValue: computed(() => toValue(options.defaultValue) ?? initialValue),
    formatValue: (locale, fieldOptions) => {
      const current = value.value;

      if (!isComplete(current)) return null;

      const startTimeZone = "timeZone" in current.start ? current.start.timeZone : undefined;
      const endTimeZone = "timeZone" in current.end ? current.end.timeZone : undefined;
      const requested = toValue(options.granularity);
      const startGranularity = requested ?? ("minute" in current.start ? "minute" : "day");
      const endGranularity = requested ?? ("minute" in current.end ? "minute" : "day");
      const era =
        (current.start.calendar.identifier === "gregory" && current.start.era === "BC") ||
        (current.end.calendar.identifier === "gregory" && current.end.era === "BC");

      const startOptions = getFormatOptions(fieldOptions, {
        granularity: startGranularity,
        hideTimeZone: toValue(options.hideTimeZone),
        hourCycle: toValue(options.hourCycle),
        showEra: era,
        timeZone: startTimeZone,
      });

      const startDate = current.start.toDate(startTimeZone || "UTC");
      const endDate = current.end.toDate(endTimeZone || "UTC");
      const startFormatter = new DateFormatter(locale, startOptions);
      let endFormatter: Intl.DateTimeFormat;

      if (
        startTimeZone === endTimeZone &&
        startGranularity === endGranularity &&
        current.start.compare(current.end) !== 0
      ) {
        /*
         * Formatted as one range rather than as two dates, which is shorter wherever the two share
         * a part: "June 10 – 20, 2026" rather than the month and the year twice. The two halves are
         * then split apart again at the last separator the formatter marked as shared.
         */
        try {
          const parts = startFormatter.formatRangeToParts(startDate, endDate);
          let separator = -1;

          for (let index = 0; index < parts.length; index += 1) {
            const part = parts[index]!;

            if (part.source === "shared" && part.type === "literal") separator = index;
            else if (part.source === "endRange") break;
          }

          let start = "";
          let end = "";

          for (let index = 0; index < parts.length; index += 1) {
            if (index < separator) start += parts[index]!.value;
            else if (index > separator) end += parts[index]!.value;
          }

          return { end, start };
        } catch {
          // Formatting a range fails when the end comes before the start; fall through and write
          // the two dates out separately instead.
        }

        endFormatter = startFormatter;
      } else {
        endFormatter = new DateFormatter(
          locale,
          getFormatOptions(fieldOptions, {
            granularity: endGranularity,
            hideTimeZone: toValue(options.hideTimeZone),
            hourCycle: toValue(options.hourCycle),
            timeZone: endTimeZone,
          }),
        );
      }

      return { end: endFormatter.format(endDate), start: startFormatter.format(startDate) };
    },
    getDateFormatter: (locale, formatOptions) =>
      new DateFormatter(locale, getFormatOptions({}, { ...formatOpts.value, ...formatOptions })),
    granularity,
    hasTime,
    isInvalid: computed(() => validation.displayValidation.value.isInvalid),
    setDate: (part, date) => {
      const dates = dateRange.value;

      setDateRange(
        part === "start"
          ? { end: dates?.end ?? null, start: date }
          : { end: date, start: dates?.start ?? null },
      );
    },
    setDateRange,
    setDateTime: (part, dateTime) => {
      const current = value.value;

      setValue(
        part === "start"
          ? { end: current.end, start: dateTime }
          : { end: dateTime, start: current.start },
      );
    },
    setOpen: (isOpen) => {
      /*
       * Closing commits days picked without times, using placeholders for the missing halves. Times
       * picked without days are *not* committed — there are no dates to put them on, and the halves
       * are kept so reopening the popover carries on where the user left off.
       */
      const dates = dateRange.value;
      const times = timeRange.value;

      if (!isOpen && !isComplete(value.value) && isComplete(dates) && hasTime.value) {
        commitValue(dates, {
          end: times?.end ?? placeholderTime(),
          start: times?.start ?? placeholderTime(),
        });
      }

      overlay.setOpen(isOpen);
    },
    setTime: (part, time) => {
      const times = timeRange.value;

      setTimeRange(
        part === "start"
          ? { end: times?.end ?? null, start: time }
          : { end: time, start: times?.start ?? null },
      );
    },
    setTimeRange,
    setValue,
    timeRange,
    value,
  };
};
