import type {SeparatorVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface SeparatorContext {
  /**
   * Axis a Separator divides along when it does not name one itself. A container knows
   * this better than the caller does: a rule inside a horizontal toolbar runs vertically.
   */
  orientation?: ComputedRef<SeparatorVariants["orientation"]>;
}

/**
 * Loose on purpose: a Separator is perfectly usable on its own, so the absence of a
 * container is a normal state rather than an error.
 */
export const [useSeparatorContext, provideSeparatorContext] =
  createContext<SeparatorContext | null>({
    defaultValue: null,
    name: "SeparatorContext",
    strict: false,
  });
