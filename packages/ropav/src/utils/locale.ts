/** The writing direction of a locale. */
export type Direction = "ltr" | "rtl";

/** A resolved locale: its language tag and the direction that tag is written in. */
export interface Locale {
  /** The [BCP 47](https://www.ietf.org/rfc/bcp/bcp47.txt) language code. */
  locale: string;
  /** The writing direction for the locale. */
  direction: Direction;
}

/**
 * Scripts written right to left.
 *
 * Consulted before the language list below, because a language can be written in more than one
 * script — Kurdish in Arabic script reads right to left, in Latin script it does not.
 *
 * @see https://en.wikipedia.org/wiki/Right-to-left
 */
const RTL_SCRIPTS = new Set([
  "Adlm",
  "Arab",
  "Hebr",
  "Mand",
  "Mend",
  "Nkoo",
  "Rohg",
  "Samr",
  "Syrc",
  "Thaa",
]);

/** Languages written right to left, used only when the script cannot be determined. */
const RTL_LANGS = new Set([
  "ae",
  "ar",
  "arc",
  "bcc",
  "bqi",
  "ckb",
  "dv",
  "fa",
  "glk",
  "he",
  "ku",
  "mzn",
  "nqo",
  "pnb",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
]);

/**
 * The part of `Intl.Locale` that reports writing direction.
 *
 * `getTextInfo()` is in the lib now, so only the property spelling is declared here: browsers
 * shipped `textInfo` before it was standardised as a method, and it still has to be reachable
 * without widening `Intl.Locale` itself. The call site keeps its `typeof` guard for the same
 * reason — the lib types the method as always present, but the older engines do not have it.
 */
interface LocaleTextInfo {
  direction?: string;
}

interface LocaleWithTextInfo extends Intl.Locale {
  textInfo?: LocaleTextInfo;
}

/**
 * Whether a locale is read right to left, ported from React Aria's
 * `packages/react-aria/src/i18n/utils.ts` (react-aria 3.51.0).
 *
 * Asks `Intl.Locale` first and only guesses when it cannot answer.
 */
export const isRTL = (localeString: string): boolean => {
  if (Intl.Locale) {
    const locale = new Intl.Locale(localeString).maximize() as LocaleWithTextInfo;
    const textInfo =
      typeof locale.getTextInfo === "function" ? locale.getTextInfo() : locale.textInfo;

    if (textInfo) return textInfo.direction === "rtl";

    // Falling back to the script beats falling back to the language: a language can be written in
    // more than one script, and `maximize()` has just filled the script in.
    if (locale.script) return RTL_SCRIPTS.has(locale.script);
  }

  const lang = localeString.split("-")[0];

  return lang !== undefined && RTL_LANGS.has(lang);
};

/**
 * The locale the browser is set to, falling back to `en-US` when it names one `Intl` cannot use.
 *
 * Read eagerly rather than through a composable so it is available to module-level state and to
 * code running outside a component.
 */
export const getDefaultLocale = (): Locale => {
  let locale =
    (typeof navigator !== "undefined" && navigator.language) ||
    /* c8 ignore next */
    "en-US";

  try {
    Intl.DateTimeFormat.supportedLocalesOf([locale]);
  } catch {
    locale = "en-US";
  }

  return { direction: isRTL(locale) ? "rtl" : "ltr", locale };
};
