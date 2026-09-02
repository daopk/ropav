import type { CollectionKey, UseCollectionReturn } from "@/composables/use-collection";
import type { UseTabListStateReturn } from "@/composables/use-tab-list-state";

export interface TabListStateHostProps {
  /** Keys to register a tab for, in document order. */
  keys?: CollectionKey[];
  /** Keys whose tabs report themselves disabled. */
  disabled?: CollectionKey[];
  selectedKey?: CollectionKey;
  defaultSelectedKey?: CollectionKey;
  disabledKeys?: CollectionKey[];
  isDisabled?: boolean;
  id?: string;
  onSelectionChange?: (key: CollectionKey) => void;
  onReady?: (state: UseTabListStateReturn) => void;
}

export interface TabListStateTabProps {
  collection: UseCollectionReturn;
  itemKey: CollectionKey;
  isDisabled?: boolean;
}
