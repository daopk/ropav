import type {InputOTPTextAlign, UseInputOTPReturn} from "@/composables/use-input-otp";
import type {PushPasswordManagerStrategy} from "@/composables/use-password-manager-badge";

export interface InputOTPHostProps {
  maxLength: number;
  value?: string;
  defaultValue?: string;
  pattern?: RegExp | string;
  placeholder?: string;
  textAlign?: InputOTPTextAlign;
  inputMode?: string;
  autoComplete?: string;
  isDisabled?: boolean;
  pushPasswordManagerStrategy?: PushPasswordManagerStrategy;
  pasteTransformer?: (pasted: string) => string;
  noScriptCSSFallback?: string | null;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  /** Hands the engine out, since a composable cannot be reached from outside its component. */
  onReady: (otp: UseInputOTPReturn) => void;
}
