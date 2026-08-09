import type {TableSortDescriptor, TableSortDirection} from "./table.types";
import type {TableCellMeta, TableRegistry, UseTableCollectionReturn} from "../../composables";
import type {CollectionKey} from "../../composables/use-collection";
import type {UseSelectionManagerReturn} from "../../composables/use-selection-manager";
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
  /** Ask for a sort. Without a direction, the current one flips. */
  sort: (columnKey: CollectionKey, direction?: TableSortDirection) => void;
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
