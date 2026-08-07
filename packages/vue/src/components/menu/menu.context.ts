import type {CollectionKey, UseCollectionReturn} from "../../composables/use-collection";
import type {UseListKeyboardReturn} from "../../composables/use-list-keyboard";
import type {UseSelectionManagerReturn} from "../../composables/use-selection-manager";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface MenuContext {
  collection: UseCollectionReturn;
  /** The menu's own selection, and the one a section without a selection of its own uses. */
  selection: UseSelectionManagerReturn;
  keyboard: UseListKeyboardReturn;
  /** The menu's own id, which item ids are derived from. */
  menuId: ComputedRef<string>;
  /** Shared marker so an item can tell which collection it belongs to. */
  collectionId: ComputedRef<string>;
  /** Called when an item is activated. Fires alongside selection, as React Aria's does. */
  onAction?: (key: CollectionKey) => void;
  /** Closes the menu, and every menu above it, after an item is chosen. */
  onClose?: () => void;
  /** Whether choosing an item closes the menu. @default true */
  shouldCloseOnSelect: ComputedRef<boolean>;
}

/**
 * Strict: an item or section outside a menu has no collection to join and no selection to read,
 * so it would render something that looks interactive but is not.
 */
export const [useMenuContext, provideMenuContext] = createContext<MenuContext>({
  name: "MenuContext",
});

export interface MenuSectionContext {
  /** The section's own selection, if it declared one; otherwise the menu's. */
  selection: UseSelectionManagerReturn;
  shouldCloseOnSelect: ComputedRef<boolean>;
}

/** Optional: an item may sit directly in the menu rather than in a section. */
export const [useMenuSectionContext, provideMenuSectionContext] = createContext<
  MenuSectionContext | undefined
>({defaultValue: undefined, name: "MenuSectionContext", strict: false});
