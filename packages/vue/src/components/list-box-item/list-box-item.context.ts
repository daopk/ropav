import type {listboxItemVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ListBoxItemContext {
  slots: ComputedRef<ReturnType<typeof listboxItemVariants>>;
  isSelected: ComputedRef<boolean>;
}

/** Strict: an indicator only means anything as part of an item. */
export const [useListBoxItemContext, provideListBoxItemContext] = createContext<ListBoxItemContext>(
  {name: "ListBoxItemContext"},
);
