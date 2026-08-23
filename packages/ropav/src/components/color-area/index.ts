import ColorAreaRoot from "./color-area-root.vue";
import ColorAreaThumb from "./color-area-thumb.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/

export const ColorArea = Object.assign(ColorAreaRoot, {
  Root: ColorAreaRoot,
  Thumb: ColorAreaThumb,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorAreaRoot, ColorAreaThumb };

export type {
  ColorAreaRootProps,
  ColorAreaRootProps as ColorAreaProps,
  ColorAreaThumbProps,
  ColorAreaSlotProps,
  ColorAreaThumbSlotProps,
} from "./color-area.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorAreaVariants } from "@ropav/styles";

export type { ColorAreaVariants } from "@ropav/styles";
