import ColorPickerPopover from "./color-picker-popover.vue";
import ColorPickerRoot from "./color-picker-root.vue";
import ColorPickerTrigger from "./color-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorPicker = Object.assign(ColorPickerRoot, {
  Popover: ColorPickerPopover,
  Root: ColorPickerRoot,
  Trigger: ColorPickerTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorPickerPopover, ColorPickerRoot, ColorPickerTrigger };

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
export { provideColorValueContext, useColorValueContext } from "./color-picker.context";

export type { ColorValueContext } from "./color-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorPickerVariants } from "@ropav/styles";

export type { ColorPickerVariants } from "@ropav/styles";
