import type {Color} from "../utils/color-types";
import type {ComputedRef, MaybeRefOrGetter, StyleValue} from "vue";

import {computed, toValue} from "vue";

import {colorStrings} from "../i18n/color";
import {normalizeColor} from "../utils/color";

import {useId} from "./use-id";
import {useLocale} from "./use-locale";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

export interface UseColorSwatchOptions {
  /** A labelling id supplied by the caller, prepended to the swatch's own. */
  ariaLabelledby?: MaybeRefOrGetter<string | undefined>;
  /** A label supplied by the caller, appended after the colour's name. */
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  /** The color value to display in the swatch. */
  color?: MaybeRefOrGetter<Color | string | undefined>;
  /**
   * A localized accessible name for the color. By default one is generated from the colour value,
   * but a caller with a more specific name — a Pantone number, a brand colour — can say so.
   */
  colorName?: MaybeRefOrGetter<string | undefined>;
  /** Id override for the swatch element. */
  id?: MaybeRefOrGetter<string | undefined>;
}

export interface UseColorSwatchReturn {
  /** Attributes for the swatch element. Carries no listeners — a swatch is not interactive. */
  attrs: ComputedRef<Record<string, unknown>>;
  /** The parsed colour the swatch is showing. */
  color: ComputedRef<Color>;
  /** Inline style for the swatch element. */
  style: ComputedRef<StyleValue>;
}

/**
 * A swatch showing one colour, named for a screen reader.
 *
 * Ported from React Aria's `packages/react-aria/src/color/useColorSwatch.ts` (react-aria 3.51.0).
 * Entirely presentational: there is no interaction here, so unlike every other control in this
 * package the return has attributes and a style but no handlers.
 *
 * `#fff0` is the default because a swatch with no colour is a *transparent* swatch, not an
 * error — and a fully transparent colour is announced as "transparent" rather than by hue, which
 * would be meaningless.
 */
export const useColorSwatch = (options: UseColorSwatchOptions = {}): UseColorSwatchReturn => {
  const locale = useLocale();
  const strings = useLocalizedStringFormatter(colorStrings);
  const swatchId = useId(() => toValue(options.id));

  const color = computed(() => normalizeColor(toValue(options.color) || "#fff0"));

  const colorName = computed(() => {
    const given = toValue(options.colorName);

    if (given) return given;

    return color.value.getChannelValue("alpha") === 0
      ? (strings.value.format("transparent") as string)
      : color.value.getColorName(locale.value.locale);
  });

  const style = computed<StyleValue>(() => ({
    backgroundColor: color.value.toString("css"),
    // Windows high contrast would otherwise repaint the one thing the swatch exists to show.
    forcedColorAdjust: "none",
  }));

  const attrs = computed(() => {
    const labelledby = toValue(options.ariaLabelledby);
    const label = toValue(options.ariaLabel);

    return {
      /**
       * The caller's own label is appended rather than replacing the colour name, so a swatch
       * labelled "Brand" still announces which colour it is.
       */
      "aria-label": [colorName.value, label ?? ""].filter(Boolean).join(", "),
      // Only when the caller gave one: an idref pointing at nothing is worse than none at all.
      "aria-labelledby": labelledby ? `${swatchId.value} ${labelledby}` : undefined,
      "aria-roledescription": strings.value.format("colorSwatch") as string,
      id: swatchId.value,
      role: "img",
    };
  });

  return {attrs, color, style};
};
