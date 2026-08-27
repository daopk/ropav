import type { CollectionKey } from "../../composables/use-collection";
import type { FocusStrategy } from "../../composables/use-overlay-trigger-state";
import type {
  CollectionSelection,
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";

export interface MenuRootProps {
  class?: string;
  /** Overrides the menu's id, which a trigger's `aria-controls` points at. */
  id?: string;
  /** The id of the element naming the menu, normally its trigger. */
  ariaLabelledby?: string;
  /** Names the menu when it has no trigger to point `ariaLabelledby` at. */
  ariaLabel?: string;
  /** @default "none" */
  selectionMode?: SelectionMode;
  /** @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  selectedKeys?: "all" | Iterable<CollectionKey>;
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  disallowEmptySelection?: boolean;
  disabledKeys?: Iterable<CollectionKey>;
  /** @default "all" */
  disabledBehavior?: DisabledBehavior;
  /** Whether choosing an item closes the menu. @default true */
  shouldCloseOnSelect?: boolean;
  /**
   * Where focus lands when the menu appears. A selected item wins over the end asked for, and
   * with neither the menu itself takes focus.
   */
  autoFocus?: boolean | FocusStrategy;
}

export interface MenuRootEmits {
  action: [key: CollectionKey];
  close: [];
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}
