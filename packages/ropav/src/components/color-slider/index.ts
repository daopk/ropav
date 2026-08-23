import ColorSliderOutput from "./color-slider-output.vue";
import ColorSliderRoot from "./color-slider-root.vue";
import ColorSliderThumb from "./color-slider-thumb.vue";
import ColorSliderTrack from "./color-slider-track.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a colour slider, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ColorSlider = Object.assign(ColorSliderRoot, {
  Root: ColorSliderRoot,
  Output: ColorSliderOutput,
  Track: ColorSliderTrack,
  Thumb: ColorSliderThumb,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ColorSliderRoot, ColorSliderOutput, ColorSliderTrack, ColorSliderThumb};

export type {
  ColorSliderRootProps,
  ColorSliderRootProps as ColorSliderProps,
  ColorSliderOutputProps,
  ColorSliderTrackProps,
  ColorSliderThumbProps,
  ColorSliderSlotProps,
  ColorSliderThumbSlotProps,
} from "./color-slider.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorSliderVariants} from "@heroui/styles";

export type {ColorSliderVariants} from "@heroui/styles";
