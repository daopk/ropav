import type {ValidationDetails} from "@/composables/use-form-validation-state";
import type {InputOTPTextAlign} from "@/composables/use-input-otp";

export interface InputOTPFixtureProps {
  class?: string;
  inputClass?: string;
  variant?: "primary" | "secondary";
  maxLength?: number;
  value?: string;
  defaultValue?: string;
  pattern?: RegExp | string;
  placeholder?: string;
  textAlign?: InputOTPTextAlign;
  inputMode?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  validationErrors?: string[];
  validationDetails?: ValidationDetails;
  name?: string;
  id?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  /** Whether a separator splits the boxes into two groups, as the default composition does. */
  withSeparator?: boolean;
  /** Wraps the field in a real form, with a real reset button, for the reset path. */
  withForm?: boolean;
  /** Renders a label and a description around the field. */
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  /**
   * Hands the field an identity paste transformer. Its mere presence makes the engine take the
   * paste over from the browser on every platform, which is the only way to reach that code from
   * a desktop test — a native paste is the browser's own work.
   */
  withPasteTransformer?: boolean;
  pasteTransformer?: (pasted: string) => string;
  /** Renders one more box than the code is long, to pin what an out-of-range index draws. */
  withExtraSlot?: boolean;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
}
