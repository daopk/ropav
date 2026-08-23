import type { LocalizedString, LocalizedStrings } from "@internationalized/string";

/** Every message key the select strings define. */
export type SelectStringKey = "selectPlaceholder";

/**
 * Localized strings for select components, copied from react-aria-components 1.20.0
 * (`packages/react-aria-components/intl/*.json`).
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */
export const selectStrings: LocalizedStrings<SelectStringKey, LocalizedString> = {
  "ar-AE": {
    selectPlaceholder: `حدد عنصرًا`,
  },
  "bg-BG": {
    selectPlaceholder: `Изберете предмет`,
  },
  "cs-CZ": {
    selectPlaceholder: `Vyberte položku`,
  },
  "da-DK": {
    selectPlaceholder: `V\xe6lg et element`,
  },
  "de-DE": {
    selectPlaceholder: `Element w\xe4hlen`,
  },
  "el-GR": {
    selectPlaceholder: `Επιλέξτε ένα αντικείμενο`,
  },
  "en-US": {
    selectPlaceholder: `Select an item`,
  },
  "es-ES": {
    selectPlaceholder: `Seleccionar un art\xedculo`,
  },
  "et-EE": {
    selectPlaceholder: `Valige \xfcksus`,
  },
  "fi-FI": {
    selectPlaceholder: `Valitse kohde`,
  },
  "fr-FR": {
    selectPlaceholder: `S\xe9lectionner un \xe9l\xe9ment`,
  },
  "he-IL": {
    selectPlaceholder: `בחר פריט`,
  },
  "hr-HR": {
    selectPlaceholder: `Odaberite stavku`,
  },
  "hu-HU": {
    selectPlaceholder: `V\xe1lasszon ki egy elemet`,
  },
  "it-IT": {
    selectPlaceholder: `Seleziona un elemento`,
  },
  "ja-JP": {
    selectPlaceholder: `項目を選択`,
  },
  "ko-KR": {
    selectPlaceholder: `항목 선택`,
  },
  "lt-LT": {
    selectPlaceholder: `Pasirinkite elementą`,
  },
  "lv-LV": {
    selectPlaceholder: `Izvēlēties vienumu`,
  },
  "nb-NO": {
    selectPlaceholder: `Velg et element`,
  },
  "nl-NL": {
    selectPlaceholder: `Selecteer een item`,
  },
  "pl-PL": {
    selectPlaceholder: `Wybierz element`,
  },
  "pt-BR": {
    selectPlaceholder: `Selecione um item`,
  },
  "pt-PT": {
    selectPlaceholder: `Selecione um item`,
  },
  "ro-RO": {
    selectPlaceholder: `Selectați un element`,
  },
  "ru-RU": {
    selectPlaceholder: `Выберите элемент`,
  },
  "sk-SK": {
    selectPlaceholder: `Vyberte položku`,
  },
  "sl-SI": {
    selectPlaceholder: `Izberite element`,
  },
  "sr-SP": {
    selectPlaceholder: `Izaberite stavku`,
  },
  "sv-SE": {
    selectPlaceholder: `V\xe4lj en artikel`,
  },
  "tr-TR": {
    selectPlaceholder: `Bir \xf6ğe se\xe7in`,
  },
  "uk-UA": {
    selectPlaceholder: `Виберіть елемент`,
  },
  "zh-CN": {
    selectPlaceholder: `选择一个项目`,
  },
  "zh-TW": {
    selectPlaceholder: `選取項目`,
  },
};
