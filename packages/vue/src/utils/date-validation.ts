import type {FormatterOptions} from "./date-format";
import type {ValidationResult} from "../composables/use-form-validation-state";
import type {DateValue} from "@internationalized/date";

import {DateFormatter} from "@internationalized/date";
import {LocalizedStringDictionary, LocalizedStringFormatter} from "@internationalized/string";

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
