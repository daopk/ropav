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
// Part order mirrors the DOM order of a colour field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ColorField = Object.assign(ColorFieldRoot, {
  Root: ColorFieldRoot,
  Group: ColorInputGroupRoot,
  Input: ColorInputGroupInput,
  Prefix: ColorInputGroupPrefix,
  Suffix: ColorInputGroupSuffix,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ColorFieldRoot};

export type {
  ColorFieldRootProps,
  ColorFieldRootProps as ColorFieldProps,
  ColorFieldRootSlotProps,
} from "./color-field.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorFieldVariants} from "@heroui/styles";

export type {ColorFieldVariants} from "@heroui/styles";
