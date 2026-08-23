import type { CollectionKey } from "../../composables/use-collection";
import type { menuItemVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface MenuItemContext {
  slots: ComputedRef<ReturnType<typeof menuItemVariants>>;
  isSelected: ComputedRef<boolean>;
  /** Whether the item opens a submenu, which the submenu indicator renders itself for. */
  hasSubmenu: ComputedRef<boolean>;
}

/** Strict: an indicator outside an item has no selection state to show. */
export const [useMenuItemContext, provideMenuItemContext] = createContext<MenuItemContext>({
  name: "MenuItemContext",
});

/**
 * What an item that opens a popup needs, supplied by whatever owns that popup.
 *
 * The item cannot work this out for itself: the submenu is declared as a sibling of the item, so
 * only their common parent knows the two belong together. Nor can the parent read the item's key
 * out of its own slot content, which is why the item reports the key rather than being told it.
 */
export interface MenuItemPopupContext {
  isOpen: ComputedRef<boolean>;
  /** `aria-controls` while open, naming the popup this item opens. */
  popupId: ComputedRef<string | undefined>;
  /**
   * Reports the item's key, id and element, which is how the popup learns which item it belongs to
   * and what names it.
   *
   * @returns The release, to be called when the item goes away.
   */
  registerTrigger: (info: {
    key: CollectionKey;
    id: string;
    element: () => HTMLElement | null;
  }) => () => void;
  /** Opens the popup instead of the item selecting or acting. */
  onActivate: (source: "pointer" | "keyboard") => void;
  onKeydown: (event: KeyboardEvent) => void;
  onPointerenter: () => void;
  onPointerleave: () => void;
}

/** Optional: most items open nothing. */
export const [useMenuItemPopupContext, provideMenuItemPopupContext] =
  createContext<MenuItemPopupContext | null>({
    defaultValue: null,
    name: "MenuItemPopupContext",
    strict: false,
  });
