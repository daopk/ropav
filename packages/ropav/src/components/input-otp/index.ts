import InputOTPGroup from "./input-otp-group.vue";
import InputOTPRoot from "./input-otp-root.vue";
import InputOTPSeparator from "./input-otp-separator.vue";
import InputOTPSlot from "./input-otp-slot.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const InputOTP = Object.assign(InputOTPRoot, {
  Group: InputOTPGroup,
  Root: InputOTPRoot,
  Separator: InputOTPSeparator,
  Slot: InputOTPSlot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { InputOTPGroup, InputOTPRoot, InputOTPSeparator, InputOTPSlot };

export type {
  InputOTPRootProps,
  InputOTPRootProps as InputOTPProps,
  InputOTPGroupProps,
  InputOTPSlotProps,
  InputOTPSeparatorProps,
} from "./input-otp.types";

/* -------------------------------------------------------------------------------------------------
 * Patterns
 * -----------------------------------------------------------------------------------------------*/
export {
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "../../composables/use-input-otp";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideInputOTPContext, useInputOTPContext } from "./input-otp.context";

export type { InputOTPContext } from "./input-otp.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { inputOTPVariants } from "@ropav/styles";

export type { InputOTPVariants } from "@ropav/styles";
