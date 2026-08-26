import type { SeparatorVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SeparatorContext {
  /**
   * Tag a horizontal Separator renders. An `hr` is the honest element for a rule between
   * two blocks, but it is the wrong child for a container that lays its children out
   * itself — a menu hands down `div` so the rule takes part in that layout instead of
   * breaking out of it.
   * @default "hr"
   */
  elementType?: "div" | "hr";
  /**
   * Axis a Separator divides along when it does not name one itself. A container knows
   * this better than the caller does: a rule inside a horizontal toolbar runs vertically.
   */
  orientation?: ComputedRef<SeparatorVariants["orientation"]>;
  /**
   * Role a Separator takes inside this container. `listbox` accepts only `option` and
   * `group` children, so a rule between its sections has to step out of the ARIA tree
   * rather than announce itself as a separator that does not belong there.
   * @default "separator"
   */
  role?: "presentation" | "separator";
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
