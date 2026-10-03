import type { LocalizedString, LocalizedStrings } from "@internationalized/string";

import { LocalizedStringDictionary } from "@internationalized/string";

/**
 * Dictionaries built so far, keyed by the table each was built from.
 *
 * A dictionary is derived entirely from its strings and is read-only afterwards, so every consumer
 * of the same table can share one. Weak, so a table that goes out of scope takes its dictionary
 * with it.
 */
const dictionaries = new WeakMap<object, LocalizedStringDictionary<string, LocalizedString>>();

/**
 * The dictionary for a table of localized strings.
 *
 * Ported from React Aria's `packages/react-aria/src/i18n/useLocalizedStringFormatter.ts`
 * (react-aria 3.51.0), without its global-dictionary lookup: that exists so a server can hand
 * pre-loaded strings to the client, which this package does not do yet.
 */
export const useLocalizedStringDictionary = <
  K extends string = string,
  T extends LocalizedString = string,
>(
  strings: LocalizedStrings<K, T>,
): LocalizedStringDictionary<K, T> => {
  const cached = dictionaries.get(strings);

  if (cached) return cached as LocalizedStringDictionary<K, T>;

  const dictionary = new LocalizedStringDictionary(strings);

  dictionaries.set(strings, dictionary as LocalizedStringDictionary<string, LocalizedString>);

  return dictionary;
};
