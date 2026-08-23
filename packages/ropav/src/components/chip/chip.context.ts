import type {chipVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ChipContext {
  slots: ComputedRef<ReturnType<typeof chipVariants>>;
}

export const [useChipContext, provideChipContext] = createContext<ChipContext>({
  name: "ChipContext",
});
