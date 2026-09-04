import ColorSwatchPickerIndicator from "./color-swatch-picker-indicator.vue";
import ColorSwatchPickerItem from "./color-swatch-picker-item.vue";
import ColorSwatchPickerRoot from "./color-swatch-picker-root.vue";
import ColorSwatchPickerSwatch from "./color-swatch-picker-swatch.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot as ColorSwatchPicker,
  ColorSwatchPickerSwatch,
};

export type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerIndicatorSlotProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerItemSlotProps,
  ColorSwatchPickerRootProps as ColorSwatchPickerProps,
  ColorSwatchPickerRootSlotProps as ColorSwatchPickerSlotProps,
  ColorSwatchPickerSwatchProps,
} from "./color-swatch-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorSwatchPickerVariants } from "@ropav/styles";

export type { ColorSwatchPickerVariants } from "@ropav/styles";
