import type {CollectionKey} from "../../composables/use-collection";
import type {SelectionMode} from "../../composables/use-selection-manager";
import type {MenuItemVariants} from "@heroui/styles";

/** State handed to the default slot, so content can follow the item's own state. */
export interface MenuItemSlotProps {
  isSelected: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isOpen: boolean;
  hasSubmenu: boolean;
  selectionMode: SelectionMode;
}

export interface MenuItemRootProps {
  class?: string;
  /**
   * The item's key, which selection, disabling and the collection all address it by.
   *
   * Falls back to a generated id, so an item that is only ever acted on still has a stable
   * identity.
   */
  id?: CollectionKey;
  /** Disables the item: it cannot be focused, selected or acted on. */
  isDisabled?: boolean;
  /**
   * The text typeahead matches against. Read from the item's own content when absent, which
   * skips the description, the indicators and the keyboard shortcut.
   */
  textValue?: string;
  /** Item variant. @default "default" */
  variant?: MenuItemVariants["variant"];
}

export interface MenuItemIndicatorProps {
  class?: string;
  /**
   * Which mark the indicator draws. A checkmark reads as "one of several", a dot as "one of
   * these" — the stylesheet does not enforce the pairing, so it is a choice.
   *
   * @default "checkmark"
   */
  type?: "checkmark" | "dot";
}

export interface MenuItemIndicatorSlotProps {
  isSelected: boolean;
}

export interface MenuItemSubmenuIndicatorProps {
  class?: string;
}
