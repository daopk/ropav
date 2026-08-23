import type {paginationVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface PaginationContext {
  slots: ComputedRef<ReturnType<typeof paginationVariants>>;
}

export const [usePaginationContext, providePaginationContext] = createContext<PaginationContext>({
  name: "PaginationContext",
});
