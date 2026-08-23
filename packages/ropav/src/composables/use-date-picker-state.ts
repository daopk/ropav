import type { FieldOptions, FormatterOptions, Granularity, TimeValue } from "../utils/date-format";
import type { FormValidationState, ValidationBehavior } from "./use-form-validation-state";
import type { OverlayTriggerState } from "./use-overlay-trigger-state";
import type { CalendarDate, DateValue } from "@internationalized/date";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { DateFormatter, toCalendarDate, toCalendarDateTime } from "@internationalized/date";
import { computed, shallowRef, toValue } from "vue";

import { getFormatOptions, getPlaceholderTime } from "../utils/date-format";
import { getDateValidationResult } from "../utils/date-validation";

import { useControllableState } from "./use-controllable-state";
import { useDefaultDateProps } from "./use-default-date-props";
import { useFormValidationState } from "./use-form-validation-state";
import { useOverlayTriggerState } from "./use-overlay-trigger-state";

export interface UseDatePickerStateOptions {
  value?: MaybeRefOrGetter<DateValue | null | undefined>;
  defaultValue?: MaybeRefOrGetter<DateValue | null | undefined>;
  onChange?: (value: DateValue | null) => void;
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
  validate?: (value: DateValue | null) => string | string[] | true | null | undefined;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  /** Whether the popover closes as soon as a date is picked. @default true */
  shouldCloseOnSelect?: MaybeRefOrGetter<boolean | (() => boolean) | undefined>;
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export interface DatePickerState extends OverlayTriggerState, FormValidationState {
  value: ComputedRef<DateValue | null>;
  defaultValue: ComputedRef<DateValue | null>;
  setValue: (value: DateValue | null) => void;
  /**
   * The date half of the value, which can be set before the time half is.
   *
   * A date-and-time picker lets the user pick a day in the calendar and a time in the field, in
   * either order, so each half is held on its own until both are known.
   */
  dateValue: ComputedRef<DateValue | null>;
  setDateValue: (value: CalendarDate) => void;
  timeValue: ComputedRef<TimeValue | null>;
  setTimeValue: (value: TimeValue) => void;
  granularity: ComputedRef<Granularity>;
  /** Whether this picker takes a time as well as a date. */
  hasTime: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  /** The value written out for a screen reader, in whatever shape the caller asks for. */
  formatValue: (locale: string, fieldOptions: FieldOptions) => string;
  getDateFormatter: (locale: string, formatOptions: FormatterOptions) => DateFormatter;
}

/**
 * The state behind a date picker: the value, whether the popover is open, and how the two halves of
 * a date-and-time value are assembled.
 *
 * Ported from react-stately's `packages/react-stately/src/datepicker/useDatePickerState.ts`
 * (react-stately 3.49.0).
 *
 * The picker owns the validation for the field inside it. It holds the value and the bounds, so it
 * is the only thing that can judge them, and the field reports through this state rather than
 * reaching a second verdict of its own.
 */
export const useDatePickerState = (options: UseDatePickerStateOptions): DatePickerState => {
  const overlay = useOverlayTriggerState({
    defaultOpen: options.defaultOpen,
    isOpen: () => toValue(options.isOpen),
    onOpenChange: options.onOpenChange,
  });

  const { setState: setValue, state: value } = useControllableState<DateValue | null>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onChange,
    value: () => toValue(options.value),
  });

  // Read once at setup, as React holds it in `useState`: a later change must not rewrite what the
  // field was reset to.
  const initialValue = value.value;

  /** Whatever value the picker can learn its shape from, even before anything is chosen. */
  const shape = computed(() => value.value || toValue(options.placeholderValue) || null);
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
   * The two halves of a pending value. Each is held on its own so the calendar and the time field
   * can be used in either order; a committed value supersedes both.
   */
  const pendingDate = shallowRef<DateValue | null>(null);
  const pendingTime = shallowRef<TimeValue | null>(null);

  const selectedDate = computed(() => value.value ?? pendingDate.value);

  /*
   * A committed value takes over only when it actually carries a time. Picking a day for a
   * date-only picker leaves a time typed earlier standing, which is what lets the two halves be
   * assembled in either order — and is exactly what upstream does.
   */
  const selectedTime = computed<TimeValue | null>(() => {
    const current = value.value;

    if (current && "hour" in current) return current as TimeValue;

    return pendingTime.value;
  });

  const showEra = computed(
    () => value.value?.calendar.identifier === "gregory" && value.value.era === "BC",
  );

  const formatOpts = computed<FormatterOptions>(() => ({
    granularity: granularity.value,
    hideTimeZone: toValue(options.hideTimeZone),
    hourCycle: toValue(options.hourCycle),
    shouldForceLeadingZeros: toValue(options.shouldForceLeadingZeros),
    showEra: showEra.value,
    timeZone: defaultTimeZone.value,
  }));

  const validation = useFormValidationState<DateValue | null>({
    builtinValidation: computed(() =>
      getDateValidationResult(
        value.value,
        toValue(options.minValue),
        toValue(options.maxValue),
        options.isDateUnavailable,
        formatOpts.value,
      ),
    ),
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    // Read through a getter, never handed over bare: `toValue` cannot tell a function-valued
    // option from a getter, and would call the validator here with no argument.
    validate: () => options.validate,
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => value.value,
  });

  /** Whether picking a date should close the popover, which the caller may decide per press. */
  const shouldCloseOnSelect = () => {
    const requested = toValue(options.shouldCloseOnSelect) ?? true;

    return typeof requested === "function" ? requested() : requested;
  };

  const placeholderTime = () =>
    getPlaceholderTime(toValue(options.defaultValue) ?? toValue(options.placeholderValue));

  const commitValue = (date: DateValue, time: TimeValue) => {
    // A zoned time keeps its own zone and offset, so the date is folded into it rather than the
    // other way round.
    setValue("timeZone" in time ? time.set(toCalendarDate(date)) : toCalendarDateTime(date, time));
    pendingDate.value = null;
    pendingTime.value = null;
    validation.commitValidation();
  };

  /**
   * Take a date from the calendar without disturbing the time.
   *
   * The calendar only knows about days, so committing its answer directly would reset the clock on
   * a value that already had one.
   */
  const setDateValue = (newValue: CalendarDate) => {
    const shouldClose = shouldCloseOnSelect();

    if (hasTime.value) {
      // Closing immediately means there is no chance to pick a time, so a placeholder stands in.
      if (selectedTime.value || shouldClose) {
        commitValue(newValue, selectedTime.value ?? placeholderTime());
      } else {
        pendingDate.value = newValue;
      }
    } else {
      setValue(newValue);
      validation.commitValidation();
    }

    if (shouldClose) overlay.setOpen(false);
  };

  const setTimeValue = (newValue: TimeValue) => {
    if (selectedDate.value && newValue) commitValue(selectedDate.value, newValue);
    else pendingTime.value = newValue;
  };

  return {
    ...validation,
    ...overlay,
    // What the calendar in the popover is bound to: the committed value once there is one, and
    // whichever day the user has picked so far while there is not.
    dateValue: selectedDate,
    defaultValue: computed(() => toValue(options.defaultValue) ?? initialValue),
    formatValue: (locale, fieldOptions) => {
      const current = value.value;

      if (!current) return "";

      const formatter = new DateFormatter(locale, getFormatOptions(fieldOptions, formatOpts.value));

      return formatter.format(current.toDate(defaultTimeZone.value ?? "UTC"));
    },
    getDateFormatter: (locale, formatOptions) =>
      new DateFormatter(locale, getFormatOptions({}, { ...formatOpts.value, ...formatOptions })),
    granularity,
    hasTime,
    isInvalid: computed(() => validation.displayValidation.value.isInvalid),
    setDateValue,
    setOpen: (isOpen) => {
      /*
       * Closing commits a date picked without a time, using a placeholder for the missing half. A
       * time picked without a date is *not* committed — there is no day to put it on, and the half
       * is kept so reopening the popover carries on where the user left off.
       */
      if (!isOpen && !value.value && pendingDate.value && hasTime.value) {
        commitValue(pendingDate.value, pendingTime.value ?? placeholderTime());
      }

      overlay.setOpen(isOpen);
    },
    setTimeValue,
    setValue,
    timeValue: selectedTime,
    value: computed(() => value.value),
  };
};
