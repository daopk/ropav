import type {TableSortDescriptor, TableSortDirection} from "./table.types";
import type {TableCellMeta, TableRegistry, UseTableCollectionReturn} from "../../composables";
import type {CollectionKey} from "../../composables/use-collection";
import type {UseGridKeyboardReturn} from "../../composables/use-grid-keyboard";
import type {UseSelectionManagerReturn} from "../../composables/use-selection-manager";
import type {
  TableColumnSize,
  UseTableColumnLayoutReturn,
} from "../../composables/use-table-column-layout";
import type {tableVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface TableContext {
  slots: ComputedRef<ReturnType<typeof tableVariants>>;
}

/**
 * Strict: every part reads its class from here, so a part outside a table would render
 * unstyled markup that still claims a table role.
 */
export const [useTableContext, provideTableContext] = createContext<TableContext>({
  name: "TableContext",
});

export interface TableGridContext {
  collection: UseTableCollectionReturn;
  /** The grid's own id, which column header and row header cell ids are built from. */
  tableId: ComputedRef<string>;
  /** Shared marker so a part can tell which grid it belongs to. */
  collectionId: ComputedRef<string>;
  /** The column being sorted and its direction, or `null` while nothing is sorted. */
  sortDescriptor: ComputedRef<TableSortDescriptor | null>;
  /** Selected and focused rows. Runs on `collection.rows`, so a row key is the item key. */
  selection: UseSelectionManagerReturn;
  /** Where focus sits in the grid, and the roving tab index every part reads from it. */
  keyboard: UseGridKeyboardReturn;
  /** Ask for a sort. Without a direction, the current one flips. */
  sort: (columnKey: CollectionKey, direction?: TableSortDirection) => void;
  /** The column that carries the chevron and the indentation, or `null` for a flat table. */
  treeColumn: ComputedRef<CollectionKey | null>;
  /** Rows currently expanded. Always empty for a flat table. */
  expandedKeys: ComputedRef<Set<CollectionKey>>;
  /** Open or close a row. Does nothing outside a tree grid. */
  toggleExpanded: (rowKey: CollectionKey) => void;
}

/**
 * Strict for the same reason: a column that cannot register has no index, so it would render
 * without the `aria-colindex` a grid is required to expose.
 */
export const [useTableGridContext, provideTableGridContext] = createContext<TableGridContext>({
  name: "TableGridContext",
});

export interface TableRowContext {
  rowKey: ComputedRef<CollectionKey>;
  /** Whether the row has children to expand, which the chevron and the cell both read. */
  hasChildRows: ComputedRef<boolean>;
  /** Whether the row is expanded. */
  isExpanded: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isSelected: ComputedRef<boolean>;
  /** Depth on the wire, counted from one, which the cells repeat. */
  level: ComputedRef<number>;
  /** Open or close this row. */
  toggle: () => void;
  /** Ids of the cells that name this row, which a selection checkbox borrows for its own name. */
  ariaLabelledBy: ComputedRef<string>;
  /** The cells of this row, which is how a cell learns which column it sits under. */
  cells: TableRegistry<TableCellMeta>;
}

/**
 * Loose, so a part can ask **whether** it sits inside a row: the selection checkbox is the same
 * component in the header and in a row, and which of the two it is decides what it toggles.
 */
export const [useTableRowContextOptional, provideTableRowContext] =
  createContext<TableRowContext | null>({
    defaultValue: null,
    name: "TableRowContext",
    strict: false,
  });

/** The row a part is required to sit inside, for the parts that mean nothing outside one. */
export const useTableRowContext = (): TableRowContext => {
  const context = useTableRowContextOptional();

  if (!context) {
    throw new Error("`TableRowContext` was consumed outside of its provider component.");
  }

  return context;
};

export interface TableResizableContainerContext {
  /** Width the columns are laid out against: the scrollable box, not the table element. */
  tableWidth: ComputedRef<number>;
  onResizeStart: (widths: Map<CollectionKey, TableColumnSize>) => void;
  onResize: (widths: Map<CollectionKey, TableColumnSize>) => void;
  onResizeEnd: (widths: Map<CollectionKey, TableColumnSize>) => void;
}

/**
 * Loose: resizing is opt-in. A table wrapped in the plain scroll container has no width to lay
 * columns out against, and reads `null` here.
 */
export const [useTableResizableContainerContext, provideTableResizableContainerContext] =
  createContext<TableResizableContainerContext | null>({
    defaultValue: null,
    name: "TableResizableContainerContext",
    strict: false,
  });

export interface TableColumnLayoutContext extends TableResizableContainerContext {
  layout: UseTableColumnLayoutReturn;
}

/**
 * Loose for the same reason, and provided by the grid rather than the container: the layout needs
 * the collection, and only the grid has it. This mirrors React Aria, where the container carries
 * the width and the table itself builds the resize state.
 */
export const [useTableColumnLayoutContext, provideTableColumnLayoutContext] =
  createContext<TableColumnLayoutContext | null>({
    defaultValue: null,
    name: "TableColumnLayoutContext",
    strict: false,
  });

export interface TableColumnContext {
  columnKey: ComputedRef<CollectionKey>;
  /** Id of the `th`, which the resizer's own accessible name points at. */
  headerId: ComputedRef<string>;
}

/** Strict: a resizer outside a column header has no column to resize. */
export const [useTableColumnContext, provideTableColumnContext] = createContext<TableColumnContext>(
  {name: "TableColumnContext"},
);
