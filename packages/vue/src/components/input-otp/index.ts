import InputOTPGroup from "./input-otp-group.vue";
import InputOTPRoot from "./input-otp-root.vue";
import InputOTPSeparator from "./input-otp-separator.vue";
import InputOTPSlot from "./input-otp-slot.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a one-time code field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const InputOTP = Object.assign(InputOTPRoot, {
  Root: InputOTPRoot,
  Group: InputOTPGroup,
  Slot: InputOTPSlot,
  Separator: InputOTPSeparator,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {InputOTPGroup, InputOTPRoot, InputOTPSeparator, InputOTPSlot};

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
export {provideInputOTPContext, useInputOTPContext} from "./input-otp.context";

export type {InputOTPContext} from "./input-otp.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inputOTPVariants} from "@heroui/styles";

export type {InputOTPVariants} from "@heroui/styles";
