import type {UseColorChannelFieldReturn} from "@/composables/use-color-channel-field";
import type {ColorChannelFieldState} from "@/composables/use-color-channel-field-state";
import type {UseColorFieldReturn} from "@/composables/use-color-field";
import type {ColorFieldState} from "@/composables/use-color-field-state";
import type {ValidationBehavior, ValidationFunction} from "@/composables/use-form-validation-state";
import type {Color, ColorChannel, ColorSpace} from "@/utils/color-types";

export interface ColorFieldStateHostProps {
  value?: Color | string | null;
  defaultValue?: Color | string | null;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<Color | null>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  onChange?: (value: Color | null) => void;
  /** Hands the state out, since a composable cannot be reached from outside its component. */
  onReady: (state: ColorFieldState) => void;
}

export interface ColorFieldHostProps extends Omit<ColorFieldStateHostProps, "onReady"> {
  ariaLabel?: string;
  placeholder?: string;
  isWheelDisabled?: boolean;
  /** Wraps the input in a form, so a real reset can be exercised. */
  withForm?: boolean;
  /** Hands the composable out, since it cannot be reached from outside its component. */
  onReady: (field: UseColorFieldReturn) => void;
}

export interface ColorChannelFieldStateHostProps {
  channel?: ColorChannel;
  colorSpace?: ColorSpace;
  value?: Color | string | null;
  defaultValue?: Color | string | null;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  locale?: string;
  validationBehavior?: ValidationBehavior;
  onChange?: (value: Color | null) => void;
  onReady: (state: ColorChannelFieldState) => void;
}

export interface ColorChannelFieldHostProps extends Omit<
  ColorChannelFieldStateHostProps,
  "onReady"
> {
  ariaLabel?: string;
  isRequired?: boolean;
  isWheelDisabled?: boolean;
  withForm?: boolean;
  onReady: (field: UseColorChannelFieldReturn) => void;
}
