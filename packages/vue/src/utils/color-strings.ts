/**
 * The vocabulary `getColorName` and `getChannelName` read from.
 *
 * Ported from React Stately's `intl/color/en-US.json` (react-stately 3.49.0). Upstream reaches
 * these through `LocalizedStringDictionary` and a `LocalizedStringFormatter`; there is no locale
 * layer in this package, so the English table is inlined and the two message templates become
 * plain functions. Same trade-off, and the same reason, as `live-announcer.ts`.
 *
 * Not re-exported from `utils/index.ts` — a consumer has no use for the table, only for the
 * names the colour model builds out of it.
 */

/**
 * Channel names, lightness and chroma modifiers, and hue names, in one table.
 *
 * The single table is deliberate rather than three: `red`, `green` and `blue` are *both* channel
 * names and hue names, and the two readings differ only in case. `getChannelName` wants `"Red"`,
 * a hue wants `"red"`, and upstream resolves that by lowercasing at the hue lookup — so splitting
 * the table would mean deciding which reading owns the key, and the answer is neither.
 */
const COLOR_STRINGS: Readonly<Record<string, string>> = Object.freeze({
  alpha: "Alpha",
  black: "black",
  blue: "Blue",
  "blue purple": "blue purple",
  brightness: "Brightness",
  brown: "brown",
  "brown yellow": "brown yellow",
  cyan: "cyan",
  "cyan blue": "cyan blue",
  dark: "dark",
  gray: "gray",
  grayish: "grayish",
  green: "Green",
  "green cyan": "green cyan",
  hue: "Hue",
  light: "light",
  lightness: "Lightness",
  magenta: "magenta",
  "magenta pink": "magenta pink",
  orange: "orange",
  "orange yellow": "orange yellow",
  pale: "pale",
  pink: "pink",
  "pink red": "pink red",
  purple: "purple",
  "purple magenta": "purple magenta",
  red: "Red",
  "red orange": "red orange",
  saturation: "Saturation",
  "very dark": "very dark",
  "very light": "very light",
  vibrant: "vibrant",
  white: "white",
  yellow: "yellow",
  "yellow green": "yellow green",
});

/**
 * Look a key up in the colour vocabulary.
 *
 * Falls back to the key itself, which is what upstream's dictionary does for a locale that has
 * no translation — and here it also means a compound hue name stays readable if the table ever
 * drifts from the hue table in `color-oklch.ts`.
 */
export const getColorString = (key: string): string => COLOR_STRINGS[key] ?? key;

/**
 * `"${lightness} ${chroma} ${hue}"`, collapsed.
 *
 * Any of the three may be empty — a mid-lightness, mid-chroma colour is named by its hue alone —
 * so the collapse is what keeps `"  orange"` from reaching a screen reader.
 */
export const formatColorName = (parts: {chroma: string; hue: string; lightness: string}): string =>
  `${parts.lightness} ${parts.chroma} ${parts.hue}`.replace(/\s+/g, " ").trim();

/** `"${lightness} ${chroma} ${hue}, ${percentTransparent} transparent"`, collapsed. */
export const formatTransparentColorName = (parts: {
  chroma: string;
  hue: string;
  lightness: string;
  percentTransparent: string;
}): string =>
  `${parts.lightness} ${parts.chroma} ${parts.hue}, ${parts.percentTransparent} transparent`
    .replace(/\s+/g, " ")
    .trim();
