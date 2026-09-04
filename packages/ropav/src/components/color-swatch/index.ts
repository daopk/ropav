import ColorSwatchRoot from "./color-swatch-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ColorSwatchRoot as ColorSwatch };

export type {
  ColorSwatchRootProps as ColorSwatchProps,
  ColorSwatchSlotProps,
} from "./color-swatch.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorSwatchVariants } from "@ropav/styles";

export type { ColorSwatchVariants } from "@ropav/styles";
