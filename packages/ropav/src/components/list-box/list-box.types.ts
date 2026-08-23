import type {CollectionKey} from "../../composables/use-collection";
import type {DragAndDropHooks} from "../../composables/use-drag-and-drop";
import type {
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";
import type {DropTarget} from "../../utils/dnd-types";
import type {ListBoxVariants} from "@ropav/styles";

/**
 * @typeParam T - The item type, inferred from `items`.
 *
 * Vapor costs the type parameter nothing: `vapor` picks which codegen the SFC compiles to, while
 * `generic` is read by `vue-tsc`, and the two never meet. The emitted `.d.ts` carries `<T>` either
 * way.
 */
export interface ListBoxRootProps<T = unknown> {
  class?: string;
  /**
   * The data to render, for a virtualized listbox.
   *
   * Only meaningful inside a `Virtualizer`, which renders a window of the items rather than all
   * of them. The listbox then calls its default slot once per rendered item.
   */
  items?: readonly T[];
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: T, index: number) => CollectionKey;
  /**
   * Text an item is matched on by typeahead.
   *
   * A rendered item names itself from its content, as in the React build. This is for the items
   * that are *not* rendered: typeahead has to reach them, and only the data can answer.
   */
  itemTextValue?: (item: T) => string | undefined;
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
  /** Drag and drop behaviour, from `useDragAndDrop`. */
  dragAndDropHooks?: DragAndDropHooks;
}

export interface ListBoxRootSlotProps<T = unknown> {
  /** The datum this row was built from, when the listbox is virtualized. */
  item?: T;
  /** The row's position among all of them, zero-based. */
  index?: number;
}

export interface ListBoxDropIndicatorProps {
  /** The position this indicator stands for. */
  target: DropTarget;
  class?: string;
}

export interface ListBoxLoadMoreItemProps {
  class?: string;
  /** Whether the next page is on its way, which is when the indicator row is rendered. */
  isLoading?: boolean;
  /**
   * How far from the end of the scroll box loading starts, as a multiple of the box's own height.
   * `1` is one screen ahead; `0` waits until the very end comes into view. @default 1
   */
  scrollOffset?: number;
}
