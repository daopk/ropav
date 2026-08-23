import type { NumberFieldStepper, UseNumberFieldReturn } from "../../composables/use-number-field";
import type { numberFieldVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface NumberFieldContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof numberFieldVariants>>;
  /** The field itself, which the input and the group read their wiring from. */
  field: UseNumberFieldReturn;
  increment: NumberFieldStepper;
  decrement: NumberFieldStepper;
}

/**
 * Carries the field down to its parts.
 *
 * Strict: every part here is meaningless without the field — a stepper button with no value to
 * step is a button that does nothing.
 */
export const [useNumberFieldContext, provideNumberFieldContext] = createContext<NumberFieldContext>(
  { name: "NumberFieldContext" },
);
