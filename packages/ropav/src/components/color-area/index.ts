import ColorAreaRoot from "./color-area-root.vue";
import ColorAreaThumb from "./color-area-thumb.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorAreaRoot as ColorArea, ColorAreaThumb };

export type {
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
