import type {
  FieldOptions,
  FormatterOptions,
  Granularity,
  MaxGranularity,
} from "../utils/date-format";
import type { DateSegmentType, HourCycle, SegmentLimits } from "../utils/incomplete-date";
import type { FormValidationState, ValidationBehavior } from "./use-form-validation-state";
import type { Calendar, CalendarIdentifier, DateValue } from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import {
  DateFormatter,
  GregorianCalendar,
  isEqualCalendar,
  toCalendar,
} from "@internationalized/date";
import { NumberFormatter } from "@internationalized/number";
import { computed, shallowRef, toValue } from "vue";

import { convertValue, createPlaceholderDate, getFormatOptions } from "../utils/date-format";
import { getDatePlaceholder } from "../utils/date-placeholder";
import { getDateValidationResult } from "../utils/date-validation";
import { IncompleteDate } from "../utils/incomplete-date";

import { useControllableState } from "./use-controllable-state";
import { useDefaultDateProps } from "./use-default-date-props";
import { useFormValidationState } from "./use-form-validation-state";
import { useLocale } from "./use-locale";

export interface DateSegment extends Partial<SegmentLimits> {
  /** Which part of the date this is. */
  type: DateSegmentType;
  /** What the segment shows, which is the placeholder while it is still blank. */
  text: string;
  /** Whether nothing has been typed here yet. */
  isPlaceholder: boolean;
  /** What to show while the segment is blank. */
  placeholder: string;
  /** Whether the user can change this segment at all. */
  isEditable: boolean;
}

/** Segments the user can type into. Literals and the time zone name are display only. */
const EDITABLE_SEGMENTS: Partial<Record<DateSegmentType, boolean>> = {
  day: true,
  dayPeriod: true,
  era: true,
  hour: true,
  minute: true,
  month: true,
  second: true,
  year: true,
};

/** How far Page Up and Page Down move each segment. */
const PAGE_STEP: Partial<Record<DateSegmentType, number>> = {
  day: 7,
  hour: 2,
  minute: 15,
  month: 2,
  second: 15,
  year: 5,
};

/** Part types `Intl.DateTimeFormat` reports under other names. */
const TYPE_MAPPING: Record<string, DateSegmentType> = {
  // Node lowercases this one.
  dayperiod: "dayPeriod",
  // A related Gregorian year shown beside a non-Gregorian one edits the year.
  relatedYear: "year",
  // The name of a year in a cyclic calendar is not editable.
  unknown: "literal",
  yearName: "literal",
};

/** Unicode isolates, used to keep a time reading left to right inside a right-to-left field. */
const LTR_ISOLATE = "⁦";
const POP_ISOLATE = "⁩";

export interface UseDateFieldStateOptions {
  value?: MaybeRefOrGetter<DateValue | null | undefined>;
  defaultValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  onChange?: (value: DateValue | null) => void;
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
  maxGranularity?: MaybeRefOrGetter<MaxGranularity | undefined>;
  hourCycle?: MaybeRefOrGetter<12 | 24 | undefined>;
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>;
  shouldForceLeadingZeros?: MaybeRefOrGetter<boolean | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: (value: DateValue | null) => string | string[] | true | null | undefined;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /**
   * A validation state owned by the picker above, which this field reports through.
   *
   * The picker holds the value and the bounds, so it is the one that can judge them; without this
   * the field would build a second state and the two could disagree about the same date.
   */
  validationState?: FormValidationState;
  name?: MaybeRefOrGetter<string | undefined>;
  /** Overrides the locale in force, for a field that must not follow its surroundings. */
  locale?: MaybeRefOrGetter<string | undefined>;
  /** Builds the calendar system for an identifier. Injectable so a build can ship fewer of them. */
  createCalendar: (identifier: CalendarIdentifier) => Calendar;
}

export interface DateFieldState extends FormValidationState {
  value: ComputedRef<DateValue | null>;
  defaultValue: ComputedRef<DateValue | null>;
  /** The current value as a native `Date`, which is what a formatter takes. */
  dateValue: ComputedRef<Date>;
  calendar: ComputedRef<Calendar>;
  segments: ComputedRef<DateSegment[]>;
  dateFormatter: ComputedRef<DateFormatter>;
  isInvalid: ComputedRef<boolean>;
  granularity: ComputedRef<Granularity>;
  maxGranularity: ComputedRef<MaxGranularity>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  setValue: (value: DateValue | IncompleteDate | null) => void;
  increment: (type: DateSegmentType) => void;
  decrement: (type: DateSegmentType) => void;
  incrementPage: (type: DateSegmentType) => void;
  decrementPage: (type: DateSegmentType) => void;
  incrementToMax: (type: DateSegmentType) => void;
  decrementToMin: (type: DateSegmentType) => void;
  setSegment: (type: DateSegmentType, value: number | string) => void;
  /** Commits a complete-but-unconstrained value, which is what leaving the field does. */
  confirmPlaceholder: () => void;
  clearSegment: (type: DateSegmentType) => void;
  formatValue: (fieldOptions: FieldOptions) => string;
  getDateFormatter: (locale: string, formatOptions: FormatterOptions) => DateFormatter;
}

/**
 * The state behind a date field: which segments it has, what each one shows, and what typing or
 * stepping one of them does.
 *
 * Ported from react-stately's `packages/react-stately/src/datepicker/useDateFieldState.ts`
 * (react-stately 3.49.0).
 *
 * The value the owner sees and the value on screen are deliberately two different things. A field
 * being typed into can hold "February 30" or a year with no month, neither of which is a real date,
 * so an `IncompleteDate` carries what is displayed and `onChange` only fires once the segments add
 * up to a date that survives its own validation.
 */
export const useDateFieldState = (options: UseDateFieldStateOptions): DateFieldState => {
  const { createCalendar } = options;
  const resolvedLocale = useLocale();
  const locale = computed(() => toValue(options.locale) ?? resolvedLocale.value.locale);

  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const isRequired = computed(() => Boolean(toValue(options.isRequired)));
  const maxGranularity = computed<MaxGranularity>(() => toValue(options.maxGranularity) ?? "year");

  /** Whatever value the field can learn its shape from, even before anything is typed. */
  const shape = computed(
    () =>
      toValue(options.value) ||
      toValue(options.defaultValue) ||
      toValue(options.placeholderValue) ||
      null,
  );

  // Shared with both pickers rather than worked out here: all three have to agree on how precise
  // the control is, or a picker would drop the time its own field is showing segments for.
  const { defaultTimeZone, granularity } = useDefaultDateProps(shape, () =>
    toValue(options.granularity),
  );

  const timeZone = computed(() => defaultTimeZone.value || "UTC");

  /** The calendar system and clock the locale implies, unless the caller overrode the clock. */
  const calendarAndHourCycle = computed<[Calendar, HourCycle]>(() => {
    const requested = toValue(options.hourCycle);
    const formatter = new DateFormatter(locale.value, {
      dateStyle: "short",
      hour12: requested != null ? requested === 12 : undefined,
      timeStyle: "short",
    });
    const resolved = formatter.resolvedOptions();

    return [
      createCalendar(resolved.calendar as CalendarIdentifier),
      resolved.hourCycle as HourCycle,
    ];
  });

  const calendar = computed(() => calendarAndHourCycle.value[0]);
  const hourCycle = computed(() => calendarAndHourCycle.value[1]);

  const { setState: setDate, state: value } = useControllableState<DateValue | null>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  // Captured once, so a form reset has the value the field was born with rather than the current
  // one. React takes this from `useState(value)` on first render.
  const initialValue = value.value;

  const calendarValue = computed(() => convertValue(value.value, calendar.value) ?? null);

  /**
   * A half-typed value the field is showing instead of its real one.
   *
   * Stamped with the inputs it was derived from: when the value, calendar or clock changes
   * underneath, the override is stale and the display goes back to following the real value.
   * React does the same check by comparing against `useState` copies during render.
   */
  const override = shallowRef<{
    calendar: Calendar;
    date: IncompleteDate;
    hourCycle: HourCycle;
    value: DateValue | null;
  } | null>(null);

  const displayValue = computed(() => {
    const current = override.value;

    if (
      current &&
      current.value === calendarValue.value &&
      current.hourCycle === hourCycle.value &&
      isEqualCalendar(current.calendar, calendar.value)
    ) {
      return current.date;
    }

    return new IncompleteDate(calendar.value, hourCycle.value, calendarValue.value);
  });

  const setDisplayValue = (date: IncompleteDate | null) => {
    override.value =
      date == null
        ? null
        : {
            calendar: calendar.value,
            date,
            hourCycle: hourCycle.value,
            value: calendarValue.value,
          };
  };

  // A Gregorian year before AD 1 has to say so, or the field would read as the same year AD.
  const showEra = computed(
    () => calendar.value.identifier === "gregory" && displayValue.value.era === "BC",
  );

  const formatOpts = computed<FormatterOptions>(() => ({
    granularity: granularity.value,
    hideTimeZone: toValue(options.hideTimeZone),
    hourCycle: toValue(options.hourCycle),
    maxGranularity: maxGranularity.value,
    shouldForceLeadingZeros: toValue(options.shouldForceLeadingZeros),
    showEra: showEra.value,
    timeZone: defaultTimeZone.value,
  }));

  const dateFormatter = computed(
    () => new DateFormatter(locale.value, getFormatOptions({}, formatOpts.value)),
  );
  const resolvedOptions = computed(() => dateFormatter.value.resolvedOptions());

  const placeholder = computed(() =>
    createPlaceholderDate(
      toValue(options.placeholderValue),
      granularity.value,
      calendar.value,
      defaultTimeZone.value,
    ),
  );

  /**
   * The segments the field is meant to show, in order.
   *
   * Kept separate from the formatter's own parts because this list drives "is the value complete
   * enough to emit", where literals and the time zone name have no say.
   */
  const displaySegments = computed<DateSegmentType[]>(() => {
    const is12Hour = hourCycle.value === "h11" || hourCycle.value === "h12";
    const all: DateSegmentType[] = [
      "era",
      "year",
      "month",
      "day",
      "hour",
      ...(is12Hour ? (["dayPeriod"] as const) : []),
      "minute",
      "second",
    ];
    const from = all.indexOf(toValue(options.maxGranularity) ?? "era");
    const to = all.indexOf(
      granularity.value === "hour" && is12Hour ? "dayPeriod" : granularity.value,
    );

    return all.slice(from, to + 1);
  });

  const setValue = (next: DateValue | IncompleteDate | null) => {
    if (isDisabled.value || isReadOnly.value) return;

    if (next == null || (next instanceof IncompleteDate && next.isCleared(displaySegments.value))) {
      setDisplayValue(null);
      setDate(null);

      return;
    }

    if (!(next instanceof IncompleteDate)) {
      // The calendar the field displays in must not leak into what the owner receives, so the
      // value goes back out in the calendar it arrived in.
      setDisplayValue(null);
      setDate(toCalendar(next, shape.value?.calendar ?? new GregorianCalendar()));

      return;
    }

    if (next.isComplete(displaySegments.value)) {
      const asDate = next.toValue(calendarValue.value ?? placeholder.value);

      // Complete *and* self-consistent — February 30 is complete but does not survive this, so it
      // stays on screen until the field is left.
      if (next.validate(asDate, displaySegments.value)) {
        const emitted = toCalendar(asDate, shape.value?.calendar ?? new GregorianCalendar());

        if (!value.value || emitted.compare(value.value) !== 0) {
          setDisplayValue(null);
          setDate(emitted);

          return;
        }
      }
    }

    setDisplayValue(next);
  };

  const dateValue = computed(() =>
    displayValue.value.toValue(calendarValue.value ?? placeholder.value).toDate(timeZone.value),
  );

  const segments = computed(() =>
    processSegments(
      dateValue.value,
      displayValue.value,
      dateFormatter.value,
      resolvedOptions.value,
      calendar.value,
      locale.value,
      granularity.value,
    ),
  );

  const builtinValidation = computed(() =>
    getDateValidationResult(
      value.value,
      toValue(options.minValue),
      toValue(options.maxValue),
      options.isDateUnavailable,
      formatOpts.value,
    ),
  );

  const validation = useFormValidationState<DateValue | null>({
    builtinValidation,
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    /*
     * Read through a getter, not handed over bare. `useFormValidationState` resolves this option
     * with `toValue`, which cannot tell a function-valued option from a getter — a bare validator
     * would be *called* here with no argument, so one returning a message would then be invoked as
     * if the message were itself a function.
     */
    validate: () => options.validate,
    validationBehavior: () => toValue(options.validationBehavior),
    validationState: options.validationState,
    value: () => value.value,
  });

  const adjustSegment = (type: DateSegmentType, amount: number) => {
    setValue(displayValue.value.cycle(type, amount, placeholder.value, displaySegments.value));
  };

  return {
    ...validation,
    calendar,
    clearSegment: (type) => {
      const cleared =
        type === "timeZoneName" || type === "literal"
          ? displayValue.value
          : displayValue.value.clear(type);

      setValue(cleared);
    },
    confirmPlaceholder: () => {
      if (isDisabled.value || isReadOnly.value) return;

      // Leaving the field is where a complete-but-unconstrained value is finally resolved, which
      // is what turns a typed February 30 into the end of February.
      if (displayValue.value.isComplete(displaySegments.value)) {
        const asDate = displayValue.value.toValue(calendarValue.value ?? placeholder.value);
        const emitted = toCalendar(asDate, shape.value?.calendar ?? new GregorianCalendar());

        if (!value.value || emitted.compare(value.value) !== 0) setDate(emitted);

        setDisplayValue(null);
      }
    },
    dateFormatter,
    dateValue,
    decrement: (type) => adjustSegment(type, -1),
    decrementPage: (type) => adjustSegment(type, -(PAGE_STEP[type] ?? 1)),
    decrementToMin: (type) => {
      // On a 12-hour clock the smallest hour shown is 12, which sorts above every other hour.
      const min =
        type === "hour" && hourCycle.value === "h12"
          ? 12
          : displayValue.value.getSegmentLimits(type)!.minValue;

      setValue(displayValue.value.set(type, min, placeholder.value));
    },
    defaultValue: computed(() => toValue(options.defaultValue) ?? initialValue),
    formatValue: (fieldOptions) => {
      if (!calendarValue.value) return "";

      return new DateFormatter(
        locale.value,
        getFormatOptions(fieldOptions, formatOpts.value),
      ).format(dateValue.value);
    },
    getDateFormatter: (formatterLocale, formatOptions) =>
      new DateFormatter(
        formatterLocale,
        getFormatOptions({}, { ...formatOpts.value, ...formatOptions }),
      ),
    granularity,
    increment: (type) => adjustSegment(type, 1),
    incrementPage: (type) => adjustSegment(type, PAGE_STEP[type] ?? 1),
    incrementToMax: (type) => {
      // And the largest is 11, for the same reason.
      const max =
        type === "hour" && hourCycle.value === "h12"
          ? 11
          : displayValue.value.getSegmentLimits(type)!.maxValue;

      setValue(displayValue.value.set(type, max, placeholder.value));
    },
    isDisabled,
    isInvalid: computed(() => validation.displayValidation.value.isInvalid),
    isReadOnly,
    isRequired,
    maxGranularity,
    segments,
    setSegment: (type, next) => setValue(displayValue.value.set(type, next, placeholder.value)),
    setValue,
    value: calendarValue,
  };
};

/**
 * Turn a formatted date into the segments a field renders.
 *
 * The numbers are written from the raw values rather than taken from `formatToParts`, because the
 * date handed to the formatter has already been constrained — showing its output would snap a
 * half-typed February 30 back to the 28th while the user is still on the day segment.
 */
const processSegments = (
  dateValue: Date,
  displayValue: IncompleteDate,
  dateFormatter: DateFormatter,
  resolvedOptions: Intl.ResolvedDateTimeFormatOptions,
  calendar: Calendar,
  locale: string,
  granularity: Granularity,
): DateSegment[] => {
  const parts = dateFormatter.formatToParts(dateValue);
  const numberFormatter = new NumberFormatter(locale, { useGrouping: false });
  const twoDigitFormatter = new NumberFormatter(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });

  const written = parts.map((part) => {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day" ||
      part.type === "hour"
    ) {
      const raw = displayValue[part.type] ?? 0;
      const formatter =
        resolvedOptions[part.type] === "2-digit" ? twoDigitFormatter : numberFormatter;

      return { ...part, value: formatter.format(raw) };
    }

    return part;
  });

  const result: DateSegment[] = [];
  const isTime = (type: DateSegmentType) =>
    type === "hour" || type === "minute" || type === "second";

  const literal = (text: string): DateSegment => ({
    isEditable: false,
    isPlaceholder: false,
    placeholder: "",
    text,
    type: "literal",
  });

  for (const part of written) {
    const type = TYPE_MAPPING[part.type] ?? (part.type as DateSegmentType);
    // A calendar with a single era has nothing to switch between, so its era segment is read only.
    const isEditable =
      Boolean(EDITABLE_SEGMENTS[type]) && !(type === "era" && calendar.getEras().length === 1);
    const isPlaceholder =
      Boolean(EDITABLE_SEGMENTS[type]) && displayValue[part.type as keyof IncompleteDate] == null;
    const placeholder = EDITABLE_SEGMENTS[type] ? getDatePlaceholder(type, part.value, locale) : "";

    const segment: DateSegment = {
      ...displayValue.getSegmentLimits(type),
      isEditable,
      isPlaceholder,
      placeholder,
      text: isPlaceholder ? placeholder : part.value,
      type,
    };

    /*
     * A right-to-left locale would otherwise lay a time out as minute:hour, because the colon
     * between them is neutral and takes the paragraph direction. Wrapping the run of time segments
     * in a left-to-right isolate pins them the right way round without affecting the date.
     */
    if (type === "hour") {
      result.push(literal(LTR_ISOLATE), segment);

      if (type === granularity) result.push(literal(POP_ISOLATE));
    } else if (isTime(type) && type === granularity) {
      result.push(segment, literal(POP_ISOLATE));
    } else {
      result.push(segment);
    }
  }

  return result;
};
