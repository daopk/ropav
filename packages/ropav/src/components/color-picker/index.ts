import ColorPickerPopover from "./color-picker-popover.vue";
import ColorPickerRoot from "./color-picker-root.vue";
import ColorPickerTrigger from "./color-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorPickerPopover, ColorPickerRoot as ColorPicker, ColorPickerTrigger };

export type {
  ColorPickerPopoverProps,
  ColorPickerRootProps as ColorPickerProps,
  ColorPickerRootSlotProps as ColorPickerSlotProps,
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
