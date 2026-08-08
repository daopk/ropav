import type {linkVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface LinkContext {
  /** Slot classes the icon pulls its own class from. */
  slots: ComputedRef<ReturnType<typeof linkVariants>>;
}

/**
 * Carries the resolved slot functions from the link down to its icon.
 *
 * Strict: an icon carrying the link's class with no link around it would be styled for a link
 * that is not there — and the class only does anything nested inside `.link` anyway.
 */
export const [useLinkContext, provideLinkContext] = createContext<LinkContext>({
  name: "LinkContext",
});
