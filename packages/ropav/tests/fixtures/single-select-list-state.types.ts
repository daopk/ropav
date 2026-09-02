import type { CollectionKey, UseCollectionReturn } from "@/composables/use-collection";
import type { UseSingleSelectListStateReturn } from "@/composables/use-single-select-list-state";

export interface SingleSelectListStateHostProps {
  /** Keys to register an item for, in document order. */
  keys?: CollectionKey[];
  /** Keys whose items report themselves disabled. */
  disabled?: CollectionKey[];
  selectedKey?: CollectionKey;
  defaultSelectedKey?: CollectionKey;
  disabledKeys?: CollectionKey[];
  isDisabled?: boolean;
  onSelectionChange?: (key: CollectionKey) => void;
  onReady?: (state: UseSingleSelectListStateReturn) => void;
}

export interface SingleSelectListStateItemProps {
  collection: UseCollectionReturn;
  itemKey: CollectionKey;
  isDisabled?: boolean;
}
