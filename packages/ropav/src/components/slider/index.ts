import SliderFill from "./slider-fill.vue";
import SliderMarks from "./slider-marks.vue";
import SliderOutput from "./slider-output.vue";
import SliderRoot from "./slider-root.vue";
import SliderThumb from "./slider-thumb.vue";
import SliderTrack from "./slider-track.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Slider = Object.assign(SliderRoot, {
  Fill: SliderFill,
  Marks: SliderMarks,
  Output: SliderOutput,
  Root: SliderRoot,
  Thumb: SliderThumb,
  Track: SliderTrack,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SliderRoot, SliderOutput, SliderTrack, SliderFill, SliderThumb, SliderMarks };

export type {
  SliderRootProps,
  SliderRootProps as SliderProps,
  SliderOutputProps,
  SliderTrackProps,
  SliderFillProps,
  SliderThumbProps,
  SliderMarksProps,
  SliderSlotProps,
  SliderThumbSlotProps,
} from "./slider.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { sliderVariants } from "@ropav/styles";

export type { SliderVariants } from "@ropav/styles";
