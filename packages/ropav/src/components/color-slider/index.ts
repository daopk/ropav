import ColorSliderOutput from "./color-slider-output.vue";
import ColorSliderRoot from "./color-slider-root.vue";
import ColorSliderThumb from "./color-slider-thumb.vue";
import ColorSliderTrack from "./color-slider-track.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorSliderRoot as ColorSlider, ColorSliderOutput, ColorSliderTrack, ColorSliderThumb };

export type {
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
