import type {cardVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface CardContext {
  slots: ComputedRef<ReturnType<typeof cardVariants>>;
}

export const [useCardContext, provideCardContext] = createContext<CardContext>({
  name: "CardContext",
});
