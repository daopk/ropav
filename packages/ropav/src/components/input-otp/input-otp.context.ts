import type { inputOTPVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface InputOTPContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof inputOTPVariants>>;
  isDisabled: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
}

/**
 * Carries the resolved slot functions and the field's state from the field down to its parts.
 *
 * Separate from the engine's own context, which carries what each slot should draw. This one is
 * about how the boxes look; that one is about what is in them.
 *
 * Strict: a part with the field's class on it but no field around it would be styled for a shell
 * that is not there.
 */
export const [useInputOTPContext, provideInputOTPContext] = createContext<InputOTPContext>({
  name: "InputOTPContext",
});
