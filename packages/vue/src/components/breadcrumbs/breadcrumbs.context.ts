import type {CollectionKey, UseCollectionReturn} from "../../composables/use-collection";
import type {breadcrumbsVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface BreadcrumbsContext {
  collection: UseCollectionReturn;
  isDisabled: ComputedRef<boolean>;
  onAction: (key: CollectionKey) => void;
  separator: ComputedRef<unknown>;
  slots: ComputedRef<ReturnType<typeof breadcrumbsVariants>>;
}

export const [useBreadcrumbsContext, provideBreadcrumbsContext] = createContext<BreadcrumbsContext>(
  {name: "BreadcrumbsContext"},
);
