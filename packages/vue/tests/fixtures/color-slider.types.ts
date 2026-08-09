import type {ColorSliderState, UseColorSliderReturn} from "@/composables";
import type {SliderOrientation} from "@/composables/use-slider-state";
import type {Color, ColorChannel, ColorSpace} from "@/utils/color-types";

export interface ColorSliderHostProps {
  channel?: ColorChannel;
  colorSpace?: ColorSpace;
  value?: Color | string;
  defaultValue?: Color | string;
  orientation?: SliderOrientation;
  isDisabled?: boolean;
  id?: string;
  labelId?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  name?: string;
  form?: string;
  onChange?: (value: Color) => void;
  /** Handed the composable's return and the state behind it. */
  onReady?: (ready: {slider: UseColorSliderReturn; state: ColorSliderState}) => void;
}

export interface ColorSliderHarnessProps extends ColorSliderHostProps {
  /** Locale to put in force above the host, for the direction the gradient runs in. */
  locale?: string;
}
