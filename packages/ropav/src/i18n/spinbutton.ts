import type {LocalizedString, LocalizedStrings} from "@internationalized/string";

/** Every message key the spinbutton strings define. */
export type SpinbuttonStringKey = "Empty";

/**
 * Localized strings for spinbutton components, copied from react-aria 3.51.0
 * (`packages/react-aria/intl/spinbutton/*.json`).
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */
export const spinbuttonStrings: LocalizedStrings<SpinbuttonStringKey, LocalizedString> = {
  "ar-AE": {
    Empty: `فارغ`,
  },
  "bg-BG": {
    Empty: `Изпразни`,
  },
  "cs-CZ": {
    Empty: `Pr\xe1zdn\xe9`,
  },
  "da-DK": {
    Empty: `Tom`,
  },
  "de-DE": {
    Empty: `Leer`,
  },
  "el-GR": {
    Empty: `Άδειο`,
  },
  "en-US": {
    Empty: `Empty`,
  },
  "es-ES": {
    Empty: `Vac\xedo`,
  },
  "et-EE": {
    Empty: `T\xfchjenda`,
  },
  "fi-FI": {
    Empty: `Tyhj\xe4`,
  },
  "fr-FR": {
    Empty: `Vide`,
  },
  "he-IL": {
    Empty: `ריק`,
  },
  "hr-HR": {
    Empty: `Prazno`,
  },
  "hu-HU": {
    Empty: `\xdcres`,
  },
  "it-IT": {
    Empty: `Vuoto`,
  },
  "ja-JP": {
    Empty: `空`,
  },
  "ko-KR": {
    Empty: `비어 있음`,
  },
  "lt-LT": {
    Empty: `Tuščias`,
  },
  "lv-LV": {
    Empty: `Tukšs`,
  },
  "nb-NO": {
    Empty: `Tom`,
  },
  "nl-NL": {
    Empty: `Leeg`,
  },
  "pl-PL": {
    Empty: `Pusty`,
  },
  "pt-BR": {
    Empty: `Vazio`,
  },
  "pt-PT": {
    Empty: `Vazio`,
  },
  "ro-RO": {
    Empty: `Gol`,
  },
  "ru-RU": {
    Empty: `Не заполнено`,
  },
  "sk-SK": {
    Empty: `Pr\xe1zdne`,
  },
  "sl-SI": {
    Empty: `Prazen`,
  },
  "sr-SP": {
    Empty: `Prazno`,
  },
  "sv-SE": {
    Empty: `Tomt`,
  },
  "tr-TR": {
    Empty: `Boş`,
  },
  "uk-UA": {
    Empty: `Пусто`,
  },
  "zh-CN": {
    Empty: `空`,
  },
  "zh-TW": {
    Empty: `空白`,
  },
};
