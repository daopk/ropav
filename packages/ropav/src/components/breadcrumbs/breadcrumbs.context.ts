import type { CollectionKey, UseCollectionReturn } from "../../composables/use-collection";
import type { breadcrumbsVariants } from "@ropav/styles";
import type { ComputedRef, ShallowRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface BreadcrumbsContext {
  collection: UseCollectionReturn;
  isDisabled: ComputedRef<boolean>;
  onAction: (key: CollectionKey) => void;
  /** Invalidates current-item state when existing DOM children move without changing size. */
  orderVersion: Readonly<ShallowRef<number>>;
  separator: ComputedRef<unknown>;
  slots: ComputedRef<ReturnType<typeof breadcrumbsVariants>>;
}

export const [useBreadcrumbsContext, provideBreadcrumbsContext] = createContext<BreadcrumbsContext>(
  { name: "BreadcrumbsContext" },
);
