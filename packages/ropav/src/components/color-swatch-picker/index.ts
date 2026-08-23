import ColorSwatchPickerIndicator from "./color-swatch-picker-indicator.vue";
import ColorSwatchPickerItem from "./color-swatch-picker-item.vue";
import ColorSwatchPickerRoot from "./color-swatch-picker-root.vue";
import ColorSwatchPickerSwatch from "./color-swatch-picker-swatch.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSwatchPicker = Object.assign(ColorSwatchPickerRoot, {
  Indicator: ColorSwatchPickerIndicator,
  Item: ColorSwatchPickerItem,
  Root: ColorSwatchPickerRoot,
  Swatch: ColorSwatchPickerSwatch,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
};

export type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerIndicatorSlotProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerItemSlotProps,
  ColorSwatchPickerRootProps,
  ColorSwatchPickerRootProps as ColorSwatchPickerProps,
  ColorSwatchPickerRootSlotProps,
  ColorSwatchPickerSwatchProps,
} from "./color-swatch-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorSwatchPickerVariants} from "@ropav/styles";

export type {ColorSwatchPickerVariants} from "@ropav/styles";
