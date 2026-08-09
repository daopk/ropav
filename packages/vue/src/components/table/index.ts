import TableBody from "./table-body.vue";
import TableCell from "./table-cell.vue";
import TableColumnResizer from "./table-column-resizer.vue";
import TableColumn from "./table-column.vue";
import TableContent from "./table-content.vue";
import TableExpandButton from "./table-expand-button.vue";
import TableFooter from "./table-footer.vue";
import TableHeader from "./table-header.vue";
import TableLoadMoreContent from "./table-load-more-content.vue";
import TableLoadMore from "./table-load-more.vue";
import TableResizableContainer from "./table-resizable-container.vue";
import TableRoot from "./table-root.vue";
import TableRow from "./table-row.vue";
import TableScrollContainer from "./table-scroll-container.vue";
import TableSelectionCheckbox from "./table-selection-checkbox.vue";
import TableSortableColumnHeader from "./table-sortable-column-header.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a table, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Table = Object.assign(TableRoot, {
  Root: TableRoot,
  ScrollContainer: TableScrollContainer,
  ResizableContainer: TableResizableContainer,
  Content: TableContent,
  Header: TableHeader,
  Column: TableColumn,
  ColumnResizer: TableColumnResizer,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  ExpandButton: TableExpandButton,
  Footer: TableFooter,
  LoadMore: TableLoadMore,
  LoadMoreContent: TableLoadMoreContent,
  SelectionCheckbox: TableSelectionCheckbox,
  SortableColumnHeader: TableSortableColumnHeader,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  TableRoot,
  TableScrollContainer,
  TableResizableContainer,
  TableContent,
  TableHeader,
  TableColumn,
  TableColumnResizer,
  TableBody,
  TableRow,
  TableCell,
  TableExpandButton,
  TableFooter,
  TableLoadMore,
  TableLoadMoreContent,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
};

export type {
  TableRootProps,
  TableRootProps as TableProps,
  TableScrollContainerProps,
  TableResizableContainerProps,
  TableContentProps,
  TableHeaderProps,
  TableColumnProps,
  TableColumnResizerProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableCellSlotProps,
  TableExpandButtonProps,
  TableFooterProps,
  TableLoadMoreProps,
  TableLoadMoreContentProps,
  TableSelectionCheckboxProps,
  TableSortableColumnHeaderProps,
  TableColumnSlotProps,
  TableRowSlotProps,
  TableSortDescriptor,
  TableSortDirection,
} from "./table.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tableVariants} from "@heroui/styles";

export type {TableVariants} from "@heroui/styles";
