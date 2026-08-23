import type {DatepickerStringKey} from "../i18n/datepicker";
import type {ComputedRef} from "vue";

import {computed} from "vue";

import {datepickerStrings} from "../i18n/datepicker";

import {useLocale} from "./use-locale";
import {useLocalizedStringDictionary} from "./use-localized-string-formatter";

export interface DisplayNames {
  /**
   * What this part of a date is called, in words.
   *
   * A method, not a bound property: on an engine with `dateTimeField` support this is
   * `Intl.DisplayNames`'s own, which throws if it is pulled off the object and called alone.
   */
  of(field: Intl.DateTimeFormatPartTypes): string | undefined;
}

/** The parts of a date the shipped strings can name. */
type NamedField = Extract<DatepickerStringKey, Intl.DateTimeFormatPartTypes>;

const NAMED_FIELDS = new Set<string>([
  "day",
  "dayPeriod",
  "era",
  "hour",
  "minute",
  "month",
  "second",
  "timeZoneName",
  "weekday",
  "year",
] satisfies NamedField[]);

/**
 * The names of the parts of a date, for labelling a field's segments.
 *
 * Ported from React Aria's `packages/react-aria/src/datepicker/useDisplayNames.ts`
 * (react-aria 3.51.0).
 *
 * `Intl.DisplayNames` has shipped for a while, but its `dateTimeField` type only arrived in v2, so
 * an engine can have the constructor and still reject the one type this needs — hence asking and
 * falling back rather than feature-detecting.
 */
export const useDisplayNames = (): ComputedRef<DisplayNames> => {
  const locale = useLocale();
  const dictionary = useLocalizedStringDictionary(datepickerStrings);

  return computed(() => {
    try {
      return new Intl.DisplayNames(locale.value.locale, {type: "dateTimeField"});
    } catch {
      /*
       * An object rather than React's class — one method is the whole of it. Anything the shipped
       * strings cannot name comes back undefined instead of throwing, which is what the return type
       * has always promised.
       */
      return {
        of: (field: Intl.DateTimeFormatPartTypes) => {
          if (!NAMED_FIELDS.has(field)) return undefined;

          const name = dictionary.getStringForLocale(field as NamedField, locale.value.locale);

          return typeof name === "string" ? name : undefined;
        },
      };
    }
  });
};
