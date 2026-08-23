import type {LocalizedString, LocalizedStrings} from "@internationalized/string";

/** Every message key the autocomplete strings define. */
export type AutocompleteStringKey = "collectionLabel";

/**
 * Localized strings for autocomplete components, copied from react-aria 3.51.0
 * (`packages/@react-aria/autocomplete/intl/*.json`).
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */
export const autocompleteStrings: LocalizedStrings<AutocompleteStringKey, LocalizedString> = {
  "ar-AE": {
    collectionLabel: `مقترحات`,
  },
  "bg-BG": {
    collectionLabel: `Предложения`,
  },
  "cs-CZ": {
    collectionLabel: `N\xe1vrhy`,
  },
  "da-DK": {
    collectionLabel: `Forslag`,
  },
  "de-DE": {
    collectionLabel: `Empfehlungen`,
  },
  "el-GR": {
    collectionLabel: `Προτάσεις`,
  },
  "en-US": {
    collectionLabel: `Suggestions`,
  },
  "es-ES": {
    collectionLabel: `Sugerencias`,
  },
  "et-EE": {
    collectionLabel: `Soovitused`,
  },
  "fi-FI": {
    collectionLabel: `Ehdotukset`,
  },
  "fr-FR": {
    collectionLabel: `Suggestions`,
  },
  "he-IL": {
    collectionLabel: `הצעות`,
  },
  "hr-HR": {
    collectionLabel: `Prijedlozi`,
  },
  "hu-HU": {
    collectionLabel: `Javaslatok`,
  },
  "it-IT": {
    collectionLabel: `Suggerimenti`,
  },
  "ja-JP": {
    collectionLabel: `候補`,
  },
  "ko-KR": {
    collectionLabel: `제안`,
  },
  "lt-LT": {
    collectionLabel: `Pasiūlymai`,
  },
  "lv-LV": {
    collectionLabel: `Ieteikumi`,
  },
  "nb-NO": {
    collectionLabel: `Forslag`,
  },
  "nl-NL": {
    collectionLabel: `Suggesties`,
  },
  "pl-PL": {
    collectionLabel: `Sugestie`,
  },
  "pt-BR": {
    collectionLabel: `Sugest\xf5es`,
  },
  "pt-PT": {
    collectionLabel: `Sugest\xf5es`,
  },
  "ro-RO": {
    collectionLabel: `Sugestii`,
  },
  "ru-RU": {
    collectionLabel: `Предложения`,
  },
  "sk-SK": {
    collectionLabel: `N\xe1vrhy`,
  },
  "sl-SI": {
    collectionLabel: `Predlogi`,
  },
  "sr-SP": {
    collectionLabel: `Predlozi`,
  },
  "sv-SE": {
    collectionLabel: `F\xf6rslag`,
  },
  "tr-TR": {
    collectionLabel: `\xd6neriler`,
  },
  "uk-UA": {
    collectionLabel: `Пропозиції`,
  },
  "zh-CN": {
    collectionLabel: `建议`,
  },
  "zh-TW": {
    collectionLabel: `建議`,
  },
};
