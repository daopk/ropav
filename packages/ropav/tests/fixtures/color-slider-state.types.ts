import type { ColorSliderState } from "@/composables/use-color-slider-state";
import type { Color, ColorChannel, ColorSpace } from "@/utils/color-types";

export interface ColorSliderStateHostProps {
  channel?: ColorChannel;
  colorSpace?: ColorSpace;
  value?: Color | string;
  defaultValue?: Color | string;
  isDisabled?: boolean;
  onChange?: (value: Color) => void;
  onChangeEnd?: (value: Color) => void;
  onReady?: (state: ColorSliderState) => void;
}
