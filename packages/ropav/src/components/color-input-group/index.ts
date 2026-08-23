import ColorInputGroupInput from "./color-input-group-input.vue";
import ColorInputGroupPrefix from "./color-input-group-prefix.vue";
import ColorInputGroupRoot from "./color-input-group-root.vue";
import ColorInputGroupSuffix from "./color-input-group-suffix.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorInputGroup = Object.assign(ColorInputGroupRoot, {
  Input: ColorInputGroupInput,
  Prefix: ColorInputGroupPrefix,
  Root: ColorInputGroupRoot,
  Suffix: ColorInputGroupSuffix,
});

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
