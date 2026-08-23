import type {DateFieldState} from "./use-date-field-state";
import type {ValidationBehavior} from "./use-form-validation-state";
import type {Granularity, TimeValue} from "../utils/date-format";
import type {DateValue} from "@internationalized/date";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {
  GregorianCalendar,
  Time,
  getLocalTimeZone,
  toCalendarDateTime,
  toTime,
  toZoned,
  today,
} from "@internationalized/date";
import {computed, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";
import {useDateFieldState} from "./use-date-field-state";

/** A time has no day, so the smallest unit it can show stops at the hour. */
export type TimeGranularity = Exclude<Granularity, "day">;

/**
 * Midnight, used when no placeholder was given.
 *
 * Held at module scope rather than built per evaluation so its identity is stable — every value in
 * `@internationalized/date` is immutable, so one instance is safe to share.
 */
const MIDNIGHT = new Time();

export interface UseTimeFieldStateOptions {
  value?: MaybeRefOrGetter<TimeValue | null | undefined>;
  defaultValue?: MaybeRefOrGetter<TimeValue | null | undefined>;
  onChange?: (value: TimeValue | null) => void;
  /** A time whose shape the placeholder follows. Defaults to midnight. */
  placeholderValue?: MaybeRefOrGetter<TimeValue | null | undefined>;
  minValue?: MaybeRefOrGetter<TimeValue | null | undefined>;
  maxValue?: MaybeRefOrGetter<TimeValue | null | undefined>;
  granularity?: MaybeRefOrGetter<TimeGranularity | undefined>;
  hourCycle?: MaybeRefOrGetter<12 | 24 | undefined>;
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>;
  shouldForceLeadingZeros?: MaybeRefOrGetter<boolean | undefined>;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: (value: TimeValue | null) => string | string[] | true | null | undefined;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  /** Overrides the locale in force, for a field that must not follow its surroundings. */
  locale?: MaybeRefOrGetter<string | undefined>;
}

export interface TimeFieldState extends DateFieldState {
  /**
   * The current time, with any date dropped.
   *
   * Null while the field is empty. React types this as always present, which its own
   * implementation contradicts, so the honest type is carried over instead.
   */
  timeValue: ComputedRef<Time | null>;
}

/**
 * A date whose time part is `value`, so a time can travel through the date field machinery.
 *
 * `date` supplies the day when the time has none of its own; today is a good enough stand-in,
 * because a time-only field never shows it.
 */
const toDateTime = (value: TimeValue | null | undefined, date?: DateValue): DateValue | null => {
  if (!value) return null;
  if ("day" in value) return value;

  return toCalendarDateTime(date ?? today(getLocalTimeZone()), value);
};

/**
 * The state behind a time field.
 *
 * Ported from react-stately's `packages/react-stately/src/datepicker/useTimeFieldState.ts`
 * (react-stately 3.49.0).
 *
 * A time field is a date field with the date hidden: the time is padded out to a full date on the
 * way in and stripped back down on the way out, so all of the segment editing lives in one place.
 */
export const useTimeFieldState = (options: UseTimeFieldStateOptions): TimeFieldState => {
  const placeholderValue = computed<TimeValue>(() => toValue(options.placeholderValue) ?? MIDNIGHT);

  const {setState: setTime, state: value} = useControllableState<TimeValue | null>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  /** Whatever the field can read its shape from, which is the placeholder while it is empty. */
  const shape = computed<TimeValue>(() => value.value ?? placeholderValue.value);

  /** The day the value carries, if it has one — the bounds have to land on that same day. */
  const day = computed(() => ("day" in shape.value ? shape.value : undefined));

  /*
   * A zone named only by `defaultValue` still has to survive the value being cleared, so it is read
   * from the prop rather than from whatever the field currently holds.
   */
  const defaultValueTimeZone = computed(() => {
    const initial = toValue(options.defaultValue);

    return initial && "timeZone" in initial ? initial.timeZone : undefined;
  });

  const placeholderDate = computed(() => {
    const zone =
      ("timeZone" in shape.value ? shape.value.timeZone : undefined) ?? defaultValueTimeZone.value;
    const asDate = toDateTime(placeholderValue.value);

    return zone && asDate ? toZoned(asDate, zone) : asDate;
  });

  const timeValue = computed<Time | null>(() => {
    const current = value.value;

    if (current == null) return null;

    return "day" in current ? toTime(current) : current;
  });

  /*
   * Left `undefined` when the owner passed no validator, so that its absence still means "nothing
   * to validate" rather than "a validator that always passes".
   */
  const validateTime = options.validate ? () => options.validate!(value.value) : undefined;

  const state = useDateFieldState({
    // A time field never shows a calendar, so which one it uses cannot matter.
    createCalendar: () => new GregorianCalendar(),
    defaultValue: () => toDateTime(toValue(options.defaultValue)),
    granularity: () => toValue(options.granularity) ?? "minute",
    hideTimeZone: () => toValue(options.hideTimeZone),
    hourCycle: () => toValue(options.hourCycle),
    isDisabled: () => toValue(options.isDisabled),
    isInvalid: () => toValue(options.isInvalid),
    isReadOnly: () => toValue(options.isReadOnly),
    isRequired: () => toValue(options.isRequired),
    locale: () => toValue(options.locale),
    maxGranularity: "hour",
    maxValue: () => toDateTime(toValue(options.maxValue), day.value),
    minValue: () => toDateTime(toValue(options.minValue), day.value),
    name: () => toValue(options.name),
    onChange: (next) => {
      /*
       * The date only existed to carry the time through, so it goes back out only if the owner's
       * own value had one, or named a zone the time has to stay in. The `hour` test is there for
       * the type system alone — a field whose smallest unit is the hour never emits a bare date.
       */
      const time = next && "hour" in next ? next : null;

      setTime(day.value || defaultValueTimeZone.value ? time : time && toTime(time));
    },
    placeholderValue: () => placeholderDate.value ?? undefined,
    shouldForceLeadingZeros: () => toValue(options.shouldForceLeadingZeros),
    /*
     * The date field validates the padded-out date; the owner asked about the time, so the
     * validator handed down ignores the date it is given and judges the time instead.
     *
     * Handed over as a plain callback, which is what this option is: the field wraps it in a getter
     * of its own before `useFormValidationState` resolves it with `toValue`. Calling the owner's
     * validator here instead would hand a message string back where a validator was expected.
     */
    validate: validateTime,
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => toDateTime(value.value),
  });

  return {...state, timeValue};
};
