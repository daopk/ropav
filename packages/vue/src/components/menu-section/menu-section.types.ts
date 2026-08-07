import type {CollectionKey} from "../../composables/use-collection";
import type {
  CollectionSelection,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";

export interface MenuSectionRootProps {
  class?: string;
  /** Names the section when it has no `Header` to point at. */
  ariaLabel?: string;
  /**
   * Gives the section a selection of its own, separate from the menu's and from any other
   * section's — one section of text styles, another of alignments.
   *
   * Without this the section is presentational and its items select through the menu.
   */
  selectionMode?: SelectionMode;
  /** @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  selectedKeys?: "all" | Iterable<CollectionKey>;
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  disallowEmptySelection?: boolean;
  /** Whether choosing an item in this section closes the menu. Inherited when absent. */
  shouldCloseOnSelect?: boolean;
}

export interface MenuSectionRootEmits {
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}
