import type {CollectionKey} from "../../composables/use-collection";
import type {ListBoxItemVariants} from "@ropav/styles";

export interface ListBoxItemRootProps {
  class?: string;
  /** The item's key within the collection. Generated when omitted. */
  id?: CollectionKey;
  /** Disables the item: it can be neither focused nor selected. */
  isDisabled?: boolean;
  /** Text the item is matched on by typeahead. Read from its content when omitted. */
  textValue?: string;
  /** Visual variant. */
  variant?: ListBoxItemVariants["variant"];
}

export interface ListBoxItemSlotProps {
  /** Whether this item is travelling with the drag in flight. */
  isDragging?: boolean;
  /** Whether a drop would land on this item. */
  isDropTarget?: boolean;
  isDisabled: boolean;
  isFocusVisible: boolean;
  isFocused: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
  selectionMode: "none" | "single" | "multiple";
}

export interface ListBoxItemIndicatorProps {
  class?: string;
}

export interface ListBoxItemIndicatorSlotProps {
  isSelected: boolean;
}
