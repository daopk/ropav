import type { searchFieldVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SearchFieldContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof searchFieldVariants>>;
  /** Whether there is nothing to clear. Read by the root to hide the clear button. */
  isEmpty: ComputedRef<boolean>;
}

/**
 * Carries the resolved slot functions from the field down to its parts.
 *
 * Separate from the text field's variant context, and deliberately so: a search field styles
 * its own control from its own variants, so it never hands a variant to a plain `Input`.
 *
 * Strict: a part with the field's class on it but no field around it would be styled for a
 * shell that is not there.
 */
export const [useSearchFieldContext, provideSearchFieldContext] = createContext<SearchFieldContext>(
  {
    name: "SearchFieldContext",
  },
);
