import ColorSliderOutput from "./color-slider-output.vue";
import ColorSliderRoot from "./color-slider-root.vue";
import ColorSliderThumb from "./color-slider-thumb.vue";
import ColorSliderTrack from "./color-slider-track.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSlider = Object.assign(ColorSliderRoot, {
  Output: ColorSliderOutput,
  Root: ColorSliderRoot,
  Thumb: ColorSliderThumb,
  Track: ColorSliderTrack,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorSliderRoot, ColorSliderOutput, ColorSliderTrack, ColorSliderThumb };

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
export { colorSliderVariants } from "@ropav/styles";

export type { ColorSliderVariants } from "@ropav/styles";
