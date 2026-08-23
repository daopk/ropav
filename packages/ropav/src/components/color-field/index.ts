import {
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorInputGroupRoot,
  ColorInputGroupSuffix,
} from "../color-input-group";

import ColorFieldRoot from "./color-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorField = Object.assign(ColorFieldRoot, {
  Group: ColorInputGroupRoot,
  Input: ColorInputGroupInput,
  Prefix: ColorInputGroupPrefix,
  Root: ColorFieldRoot,
  Suffix: ColorInputGroupSuffix,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorFieldRoot };

export type {
  ColorFieldRootProps,
  ColorFieldRootProps as ColorFieldProps,
  ColorFieldRootSlotProps,
} from "./color-field.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorFieldVariants } from "@ropav/styles";

export type { ColorFieldVariants } from "@ropav/styles";
