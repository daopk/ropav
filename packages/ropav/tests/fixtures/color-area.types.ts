import type {ColorAreaState, UseColorAreaReturn} from "@/composables";
import type {Color, ColorChannel, ColorSpace} from "@/utils/color-types";

export interface ColorAreaHostProps {
  value?: Color | string;
  defaultValue?: Color | string;
  colorSpace?: ColorSpace;
  xChannel?: ColorChannel;
  yChannel?: ColorChannel;
  isDisabled?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  xName?: string;
  yName?: string;
  form?: string;
  onChange?: (value: Color) => void;
  onChangeEnd?: (value: Color) => void;
  /** Handed the composable's return and the state behind it. */
  onReady?: (ready: {area: UseColorAreaReturn; state: ColorAreaState}) => void;
}

export interface ColorAreaHarnessProps extends ColorAreaHostProps {
  /** Locale to put in force above the host, for the direction the x axis runs in. */
  locale?: string;
}
