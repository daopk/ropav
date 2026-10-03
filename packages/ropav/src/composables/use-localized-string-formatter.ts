import type {
  LocalizedStringFormatter as Formatter,
  LocalizedString,
  LocalizedStrings,
} from "@internationalized/string";
import type { ComputedRef } from "vue";

import { LocalizedStringFormatter } from "@internationalized/string";
import { computed } from "vue";

import { useLocale } from "./use-locale";
import { useLocalizedStringDictionary } from "./use-localized-string-dictionary";

/**
 * A formatter reading a table of localized strings in the locale that applies here.
 *
 * Handed back as a computed rather than a formatter, so a consumer keeps up when the locale
 * changes underneath it — a provided locale is bindable, and the browser's own is live.
 */
export const useLocalizedStringFormatter = <
  K extends string = string,
  T extends LocalizedString = string,
>(
  strings: LocalizedStrings<K, T>,
): ComputedRef<Formatter<K, T>> => {
  const locale = useLocale();
  const dictionary = useLocalizedStringDictionary(strings);

  return computed(() => new LocalizedStringFormatter(locale.value.locale, dictionary));
};
