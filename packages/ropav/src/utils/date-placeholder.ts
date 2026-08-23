import { LocalizedStringDictionary } from "@internationalized/string";

import { datePlaceholders } from "../i18n/date-placeholders";

/** Built once: the table is fixed and the dictionary is read-only after construction. */
const dictionary = new LocalizedStringDictionary(datePlaceholders, "en");

/**
 * What an empty segment shows before anything is typed into it, ported from react-stately's
 * `packages/react-stately/src/datepicker/placeholders.ts` (react-stately 3.49.0).
 *
 * Only year, month and day get a spelled-out word. An era or day period shows the real value it
 * would take, because there is no useful abbreviation for "AD" or "AM"; every time field falls
 * back to two dashes.
 */
export const getDatePlaceholder = (field: string, value: string, locale: string): string => {
  if (field === "era" || field === "dayPeriod") return value;

  if (field === "year" || field === "month" || field === "day") {
    return dictionary.getStringForLocale(field, locale);
  }

  return "––";
};
