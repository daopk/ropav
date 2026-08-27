import type { CollectionKey } from "@/composables/use-collection";
import type { FocusStrategy } from "@/composables/use-overlay-trigger-state";
import type { SelectionMode } from "@/composables/use-selection-manager";

export interface MenuFixtureItem {
  id: string;
  label: string;
  isDisabled?: boolean;
  textValue?: string;
}

export interface MenuFixtureProps {
  class?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  autoFocus?: boolean | FocusStrategy;
  items?: MenuFixtureItem[];
  disabledKeys?: string[];
  selectionMode?: SelectionMode;
  selectedKeys?: Iterable<CollectionKey>;
  defaultSelectedKeys?: Iterable<CollectionKey>;
  disallowEmptySelection?: boolean;
  shouldCloseOnSelect?: boolean;
  /** Renders a heading beside the menu, for `ariaLabelledby` to point at. */
  withExternalLabel?: boolean;
  /** Whether the caller hands over an empty slot at all. */
  withEmptyState?: boolean;
  /** Wraps the items in a `Menu.Section`, which owns a selection of its own. */
  withSection?: boolean;
  /** Puts a separator between the items, which the menu re-homes as a `div`. */
  withSeparator?: boolean;
}
