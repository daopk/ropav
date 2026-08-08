import type {paginationVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface PaginationContext {
  slots: ComputedRef<ReturnType<typeof paginationVariants>>;
}

export const [usePaginationContext, providePaginationContext] = createContext<PaginationContext>({
  name: "PaginationContext",
});
