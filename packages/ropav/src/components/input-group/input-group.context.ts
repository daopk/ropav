import type {inputGroupVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface InputGroupContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof inputGroupVariants>>;
}

/**
 * Carries the resolved slot functions from the group down to its parts, so each part gets the
 * variant the group settled on without having to resolve it a second time.
 *
 * Strict: a prefix or a control with the group's class on it but no group around it would be
 * styled for a shell that is not there.
 */
export const [useInputGroupContext, provideInputGroupContext] = createContext<InputGroupContext>({
  name: "InputGroupContext",
});
