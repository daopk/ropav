import type { kbdVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface KbdContext {
  slots: ComputedRef<ReturnType<typeof kbdVariants>>;
}

export const [useKbdContext, provideKbdContext] = createContext<KbdContext>({
  name: "KbdContext",
});
