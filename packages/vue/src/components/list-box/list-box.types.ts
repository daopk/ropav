import type {CollectionKey} from "../../composables/use-collection";
import type {
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";
import type {ListBoxVariants} from "@heroui/styles";

export interface ListBoxRootProps {
  class?: string;
  /**
   * The data to render, for a virtualized listbox.
   *
   * Only meaningful inside a `Virtualizer`, which renders a window of the items rather than all
   * of them. The listbox then calls its default slot once per rendered item.
   *
   * Typed `unknown` rather than a generic: a generic `<script setup>` compiles in Vapor but the
   * type parameter is dropped, so it would read as typed while being nothing of the sort.
   */
  items?: readonly unknown[];
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: unknown, index: number) => CollectionKey;
  /**
   * Text an item is matched on by typeahead.
   *
   * A rendered item names itself from its content, as in the React build. This is for the items
   * that are *not* rendered: typeahead has to reach them, and only the data can answer.
   */
  itemTextValue?: (item: unknown) => string | undefined;
  /** Whether one, many or no items can be selected. @default "none" */
  selectionMode?: SelectionMode;
  /** What a press means when several items can be selected. @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  /** Selected keys, for controlled use. */
  selectedKeys?: "all" | Iterable<CollectionKey>;
  /** Selected keys the listbox starts with. */
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  /** Keys that cannot be selected, and by default cannot be focused either. */
  disabledKeys?: Iterable<CollectionKey>;
  /** Whether a disabled key is also unfocusable. @default "all" */
  disabledBehavior?: DisabledBehavior;
  /** Whether the listbox must always keep something selected. */
  disallowEmptySelection?: boolean;
  /** Visual variant. */
  variant?: ListBoxVariants["variant"];
}

export interface ListBoxRootSlotProps {
  /** The datum this row was built from, when the listbox is virtualized. */
  item?: unknown;
  /** The row's position among all of them, zero-based. */
  index?: number;
}
