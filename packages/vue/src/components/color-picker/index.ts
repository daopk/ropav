import ColorPickerPopover from "./color-picker-popover.vue";
import ColorPickerRoot from "./color-picker-root.vue";
import ColorPickerTrigger from "./color-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a picker, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const ColorPicker = Object.assign(ColorPickerRoot, {
  Root: ColorPickerRoot,
  Trigger: ColorPickerTrigger,
  Popover: ColorPickerPopover,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ColorPickerPopover, ColorPickerRoot, ColorPickerTrigger};

export type {
  ColorPickerPopoverProps,
  ColorPickerRootProps,
  ColorPickerRootProps as ColorPickerProps,
  ColorPickerRootSlotProps,
  ColorPickerTriggerProps,
} from "./color-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
// The shared colour value, exported so a caller composing their own colour control can join in.
export {provideColorValueContext, useColorValueContext} from "./color-picker.context";

export type {ColorValueContext} from "./color-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorPickerVariants} from "@heroui/styles";

export type {ColorPickerVariants} from "@heroui/styles";
