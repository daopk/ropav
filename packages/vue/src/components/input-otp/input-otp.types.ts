import type {ValidationDetails} from "../../composables/use-form-validation-state";
import type {InputOTPTextAlign} from "../../composables/use-input-otp";
import type {PushPasswordManagerStrategy} from "../../composables/use-password-manager-badge";
import type {InputOTPVariants} from "@heroui/styles";

// `isDisabled` and `isInvalid` are plain booleans with no explicit `undefined` default, unlike
// every other field here. Nothing sits above this one to inherit from — it reads no context —
// so an absent prop and a `false` prop mean the same thing, which is what React defaults them to.
export interface InputOTPRootProps {
  class?: string;
  /** Class for the hidden control. Rarely useful: it is invisible by design. */
  inputClass?: string;
  /** Visual variant. @default "primary" */
  variant?: InputOTPVariants["variant"];
  /** How many characters the code is. Decides how many slots there are. */
  maxLength: number;
  /** The code. Set it to take the field over. */
  value?: string;
  /** The code the field starts with when nothing is controlling it. */
  defaultValue?: string;
  /** Characters the code may contain, as a regular expression over the whole value. */
  pattern?: RegExp | string;
  /** Characters shown in the empty slots before anything is typed. */
  placeholder?: string;
  /** Where the text sits inside the hidden control. @default "left" */
  textAlign?: InputOTPTextAlign;
  /** Keyboard a touch device should offer. @default "numeric" */
  inputMode?: string;
  /** What the browser should offer to fill in. @default "one-time-code" */
  autoComplete?: string;
  /** Whether the field is disabled — no typing, no submission. */
  isDisabled?: boolean;
  /** Whether the code fails validation. Published to a nested `FieldError`. */
  isInvalid?: boolean;
  /** Messages a nested `FieldError` should show. */
  validationErrors?: string[];
  /** Which constraint failed, for a caller that wants to branch on the reason. */
  validationDetails?: ValidationDetails;
  /** Whether the control shrinks to clear a password manager's badge. @default "increase-width" */
  pushPasswordManagerStrategy?: PushPasswordManagerStrategy;
  /** Rewrites pasted text before it is accepted — to strip spaces or a prefix, say. */
  pasteTransformer?: (pasted: string) => string;
  /** Name submitted with the form. */
  name?: string;
  /** `id` of the form to submit with, for a field rendered outside it. */
  form?: string;
  /** Lands on the control, which is the field as far as assistive technology is concerned. */
  id?: string;
  /** Accessible name, for a field with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the field. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the field. */
  ariaDescribedby?: string;
}

export interface InputOTPGroupProps {
  class?: string;
}

export interface InputOTPSlotProps {
  class?: string;
  /** Which character of the code this box shows. */
  index: number;
}

export interface InputOTPSeparatorProps {
  class?: string;
}
