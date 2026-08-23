import ColorInputGroupInput from "./color-input-group-input.vue";
import ColorInputGroupPrefix from "./color-input-group-prefix.vue";
import ColorInputGroupRoot from "./color-input-group-root.vue";
import ColorInputGroupSuffix from "./color-input-group-suffix.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of an input group, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ColorInputGroup = Object.assign(ColorInputGroupRoot, {
  Root: ColorInputGroupRoot,
  Input: ColorInputGroupInput,
  Prefix: ColorInputGroupPrefix,
  Suffix: ColorInputGroupSuffix,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ColorInputGroupInput, ColorInputGroupPrefix, ColorInputGroupRoot, ColorInputGroupSuffix};

export type {
  ColorInputGroupRootProps,
  ColorInputGroupRootProps as ColorInputGroupProps,
  ColorInputGroupRootSlotProps,
  ColorInputGroupInputProps,
  ColorInputGroupPrefixProps,
  ColorInputGroupSuffixProps,
} from "./color-input-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  provideColorInputGroupContext,
  provideColorInputGroupControlContext,
  useColorInputGroupContext,
  useColorInputGroupControlContext,
} from "./color-input-group.context";

export type {
  ColorInputGroupContext,
  ColorInputGroupControl,
  ColorInputGroupControlHandlers,
} from "./color-input-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorInputGroupVariants} from "@ropav/styles";

export type {ColorInputGroupVariants} from "@ropav/styles";
