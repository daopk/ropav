import type {FormatterOptions} from "./date-format";
import type {ValidationResult} from "../composables/use-form-validation-state";
import type {DateValue} from "@internationalized/date";

import {DateFormatter} from "@internationalized/date";
import {LocalizedStringDictionary, LocalizedStringFormatter} from "@internationalized/string";

import {VALID_VALIDITY_STATE, mergeValidation} from "../composables/use-form-validation-state";
import {dateValidationStrings} from "../i18n/date-validation";

import {getFormatOptions} from "./date-format";
import {getDefaultLocale} from "./locale";

/** Built once: the table is fixed and the dictionary is read-only after construction. */
const dictionary = new LocalizedStringDictionary(dateValidationStrings);

/**
 * Whether a date is inside its allowed range, and the messages to show when it is not, ported from
 * react-stately's `packages/react-stately/src/datepicker/utils.ts` (react-stately 3.49.0).
 *
 * The messages are read in the **browser's** locale rather than the one a provider chose, and that
 * is deliberate upstream: they sit alongside the browser's own validation messages, which ignore
 * any provider. Mixing the two languages in one form would be worse than following the browser.
 */
export const getDateValidationResult = (
  value: DateValue | null,
  minValue: DateValue | null | undefined,
  maxValue: DateValue | null | undefined,
  isDateUnavailable: ((date: DateValue) => boolean) | undefined,
  options: FormatterOptions,
): ValidationResult => {
  const rangeOverflow = value != null && maxValue != null && value.compare(maxValue) > 0;
  const rangeUnderflow = value != null && minValue != null && value.compare(minValue) < 0;
  const isUnavailable = (value != null && isDateUnavailable?.(value)) || false;
  const isInvalid = rangeOverflow || rangeUnderflow || isUnavailable;
  const errors: string[] = [];

  if (isInvalid) {
    const {locale} = getDefaultLocale();
    const formatter = new LocalizedStringFormatter(locale, dictionary);
    const dateFormatter = new DateFormatter(locale, getFormatOptions({}, options));
    const {timeZone} = dateFormatter.resolvedOptions();

    if (rangeUnderflow && minValue != null) {
      errors.push(
        formatter.format("rangeUnderflow", {
          minValue: dateFormatter.format(minValue.toDate(timeZone)),
        }),
      );
    }

    if (rangeOverflow && maxValue != null) {
      errors.push(
        formatter.format("rangeOverflow", {
          maxValue: dateFormatter.format(maxValue.toDate(timeZone)),
        }),
      );
    }

    if (isUnavailable) errors.push(formatter.format("unavailableDate"));
  }

  return {
    isInvalid,
    validationDetails: {
      // An unavailable date is reported as bad input rather than as a range problem: it is inside
      // the range, the range simply has a hole in it.
      badInput: isUnavailable,
      customError: false,
      patternMismatch: false,
      rangeOverflow,
      rangeUnderflow,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valid: !isInvalid,
      valueMissing: false,
    },
    validationErrors: errors,
  };
};

/**
 * Whether both ends of a range are inside their allowed bounds, and in the right order.
 *
 * Only the two ends are checked against `isDateUnavailable`, never the days between them: a range
 * spanning an unavailable date is a question for the calendar, which decides whether a range may
 * cross one at all. A reversed range is reported as both an overflow and an underflow, because
 * neither end alone is the one at fault.
 */
export const getRangeValidationResult = (
  value: {start: DateValue | null; end: DateValue | null} | null,
  minValue: DateValue | null | undefined,
  maxValue: DateValue | null | undefined,
  isDateUnavailable: ((date: DateValue) => boolean) | undefined,
  options: FormatterOptions,
): ValidationResult => {
  const merged = mergeValidation(
    getDateValidationResult(value?.start ?? null, minValue, maxValue, isDateUnavailable, options),
    getDateValidationResult(value?.end ?? null, minValue, maxValue, isDateUnavailable, options),
  );

  if (value?.start == null || value.end == null || value.end.compare(value.start) >= 0) {
    return merged;
  }

  const {locale} = getDefaultLocale();
  const formatter = new LocalizedStringFormatter(locale, dictionary);

  return mergeValidation(merged, {
    isInvalid: true,
    validationDetails: {
      ...VALID_VALIDITY_STATE,
      rangeOverflow: true,
      rangeUnderflow: true,
      valid: false,
    },
    validationErrors: [formatter.format("rangeReversed")],
  });
};
