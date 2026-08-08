import TableBody from "./table-body.vue";
import TableCell from "./table-cell.vue";
import TableColumn from "./table-column.vue";
import TableContent from "./table-content.vue";
import TableFooter from "./table-footer.vue";
import TableHeader from "./table-header.vue";
import TableRoot from "./table-root.vue";
import TableRow from "./table-row.vue";
import TableScrollContainer from "./table-scroll-container.vue";
import TableSortableColumnHeader from "./table-sortable-column-header.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a table, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Table = Object.assign(TableRoot, {
  Root: TableRoot,
  ScrollContainer: TableScrollContainer,
  Content: TableContent,
  Header: TableHeader,
  Column: TableColumn,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Footer: TableFooter,
  SortableColumnHeader: TableSortableColumnHeader,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  TableRoot,
  TableScrollContainer,
  TableContent,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  TableSortableColumnHeader,
};

export type {
  TableRootProps,
  TableRootProps as TableProps,
  TableScrollContainerProps,
  TableContentProps,
  TableHeaderProps,
  TableColumnProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableFooterProps,
  TableSortableColumnHeaderProps,
  TableColumnSlotProps,
  TableSortDescriptor,
  TableSortDirection,
} from "./table.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tableVariants} from "@heroui/styles";

export type {TableVariants} from "@heroui/styles";
