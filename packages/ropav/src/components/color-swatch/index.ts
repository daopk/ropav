import ColorSwatchRoot from "./color-swatch-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSwatch = Object.assign(ColorSwatchRoot, {
  Root: ColorSwatchRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ColorSwatchRoot };

export type {
  ColorSwatchRootProps,
  ColorSwatchRootProps as ColorSwatchProps,
  ColorSwatchSlotProps,
} from "./color-swatch.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorSwatchVariants } from "@ropav/styles";

export type { ColorSwatchVariants } from "@ropav/styles";
