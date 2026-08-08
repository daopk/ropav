import type {TableCellMeta, TableRegistry, UseTableCollectionReturn} from "../../composables";
import type {CollectionKey} from "../../composables/use-collection";
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

export const [useTableRowContext, provideTableRowContext] = createContext<TableRowContext>({
  name: "TableRowContext",
});
