import type {CollectionKey} from "../../composables/use-collection";
import type {
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";
import type {TableColumnSize} from "../../composables/use-table-column-layout";
import type {CheckboxVariants, TableVariants} from "@heroui/styles";

export interface TableRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: TableVariants["variant"];
}

export interface TableScrollContainerProps {
  class?: string;
}

export interface TableContentProps {
  class?: string;
  /**
   * The column being sorted and the direction it is sorted in. Controlled with no internal
   * fallback, exactly as React Aria has it: pass back what `sortChange` hands you.
   */
  sortDescriptor?: TableSortDescriptor | null;
  /** Whether one, many or no rows can be selected. @default "none" */
  selectionMode?: SelectionMode;
  /** What a press on a row means when several rows can be selected. @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  /** Selected row keys, for controlled use. */
  selectedKeys?: "all" | Iterable<CollectionKey>;
  /** Selected row keys the table starts with. */
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  /** Row keys that cannot be selected, and by default cannot be focused either. */
  disabledKeys?: Iterable<CollectionKey>;
  /** Whether a disabled row is also unfocusable. @default "all" */
  disabledBehavior?: DisabledBehavior;
  /**
   * Whether the table must always keep a row selected. Declared as `boolean` so Vue casts a
   * bare attribute instead of reading `""`.
   */
  disallowEmptySelection?: boolean;
  /**
   * The column that carries the expand control and the indentation, which is what turns the
   * grid into a tree grid.
   */
  treeColumn?: CollectionKey;
  /** Expanded row keys, for controlled use. */
  expandedKeys?: Iterable<CollectionKey>;
  /** Expanded row keys the table starts with. */
  defaultExpandedKeys?: Iterable<CollectionKey>;
}

export interface TableHeaderProps {
  class?: string;
}

export interface TableColumnProps {
  class?: string;
  /**
   * Whether pressing this column header sorts the table. Declared as `boolean` so Vue casts a
   * bare `allows-sorting` attribute instead of reading `""`.
   */
  allowsSorting?: boolean;
  /** Identity of the column. Falls back to a generated key. */
  id?: CollectionKey;
  /**
   * Whether cells under this column name their row. Declared as `boolean` rather than through
   * the variants type, so Vue casts a bare `is-row-header` attribute instead of reading `""`.
   */
  isRowHeader?: boolean;
  /**
   * Width the caller controls, in pixels, as a percentage of the table, or in `fr` units. A
   * resize never changes it. Only read inside a `Table.ResizableContainer`.
   */
  width?: TableColumnSize;
  /** Width the column starts at, when the caller is not controlling it. @default "1fr" */
  defaultWidth?: TableColumnSize;
  /** Smallest width a resize may reach. Cannot be given in `fr`. @default 75 */
  minWidth?: TableColumnSize;
  /** Largest width a resize may reach. Cannot be given in `fr`. */
  maxWidth?: TableColumnSize;
}

export interface TableResizableContainerProps {
  class?: string;
}

export interface TableLoadMoreProps {
  class?: string;
  /** Whether the next page is on its way, which is when the indicator row is rendered. */
  isLoading?: boolean;
  /**
   * How far from the end of the scroll box loading starts, as a multiple of the box's own height.
   * `1` is one screen ahead; `0` waits until the very end comes into view. @default 1
   */
  scrollOffset?: number;
}

export interface TableLoadMoreContentProps {
  class?: string;
}

export interface TableColumnResizerProps {
  class?: string;
  /** Accessible name of the resizer. @default "Resize column" */
  ariaLabel?: string;
}

export interface TableBodyProps {
  class?: string;
}

export interface TableRowProps {
  class?: string;
  /** Identity of the row. Falls back to a generated key. */
  id?: CollectionKey;
  /** Text the row is matched on by typeahead. Derived from its row header cells when absent. */
  textValue?: string;
  /** Depth in a tree grid, counted from zero. @default 0 */
  level?: number;
  /** The row this one hangs off, in a tree grid. */
  parentKey?: CollectionKey;
  /**
   * Whether the row has children, which is what decides whether it reports expansion at all.
   * Declared as `boolean` so Vue casts a bare attribute instead of reading `""`.
   */
  hasChildRows?: boolean;
}

/** State handed to the default slot of a row. */
export interface TableRowSlotProps {
  /** Whether the row has children to expand. */
  hasChildRows: boolean;
  /** Whether the row is expanded, in a tree grid. */
  isExpanded: boolean;
  isDisabled: boolean;
  isFocusVisible: boolean;
  isFocused: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
  selectionMode: SelectionMode;
}

export interface TableCellProps {
  class?: string;
  /** Text this cell contributes to its row's text value. Derived from its content when absent. */
  textValue?: string;
}

/** State handed to the default slot of a cell. */
export interface TableCellSlotProps {
  /** Whether this cell sits under the tree column, which is the one that carries the chevron. */
  isTreeColumn: boolean;
  /** Whether the row has children to expand. */
  hasChildRows: boolean;
  /** Whether the row is expanded. */
  isExpanded: boolean;
  isDisabled: boolean;
  isSelected: boolean;
}

export interface TableFooterProps {
  class?: string;
}

export interface TableSelectionCheckboxProps {
  class?: string;
  /** Visual variant of the checkbox. */
  variant?: CheckboxVariants["variant"];
  /**
   * Accessible name. Defaults to what React Aria names it: `Select All` in the header of a
   * multiple-selection table, `Select` for a row or for a single-selection table.
   */
  ariaLabel?: string;
}

export type TableSortDirection = "ascending" | "descending";

export interface TableSortDescriptor {
  column: CollectionKey;
  direction: TableSortDirection;
}

/** State handed to the default slot of a column header. */
export interface TableColumnSlotProps {
  allowsSorting: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
  /** Whether this column is the one being resized. */
  isResizing: boolean;
  /** Begin resizing this column. Does nothing outside a `Table.ResizableContainer`. */
  startResize: () => void;
  /** The direction this column is sorted in, or `undefined` when another column is. */
  sortDirection?: TableSortDirection;
  /** Sort by this column. Without a direction, flips the current one. */
  sort: (direction?: TableSortDirection) => void;
}

export interface TableSortableColumnHeaderProps {
  class?: string;
  /**
   * Current sort direction for the column. Pass the `sortDirection` handed to the default slot
   * of `Table.Column`.
   */
  sortDirection?: TableSortDirection;
  /**
   * Whether to render the sort indicator when a direction is set.
   * @default true
   */
  showIndicator?: boolean;
}
