import type { popoverVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface PopoverContext {
  slots: ComputedRef<ReturnType<typeof popoverVariants>>;
}

/** Strict: every part of a popover is styled from the same slot set. */
export const [usePopoverContext, providePopoverContext] = createContext<PopoverContext>({
  name: "PopoverContext",
});
