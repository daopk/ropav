import TableBody from "./table-body.vue";
import TableCell from "./table-cell.vue";
import TableColumnResizer from "./table-column-resizer.vue";
import TableColumn from "./table-column.vue";
import TableContent from "./table-content.vue";
import TableDragHandle from "./table-drag-handle.vue";
import TableDropIndicator from "./table-drop-indicator.vue";
import TableExpandTrigger from "./table-expand-trigger.vue";
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
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  TableRoot as Table,
  TableScrollContainer,
  TableResizableContainer,
  TableContent,
  TableHeader,
  TableColumn,
  TableColumnResizer,
  TableBody,
  TableRow,
  TableCell,
  TableExpandTrigger,
  TableDragHandle,
  TableDropIndicator,
  TableFooter,
  TableLoadMore,
  TableLoadMoreContent,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
};

export type {
  TableRootProps as TableProps,
  TableScrollContainerProps,
  TableResizableContainerProps,
  TableContentProps,
  TableHeaderProps,
  TableHeaderSlotProps,
  TableColumnProps,
  TableColumnResizerProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableCellSlotProps,
  TableDragHandleProps,
  TableDropIndicatorProps,
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
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { TableColumnSize } from "./use-table-column-layout";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { tableVariants } from "@ropav/styles";

export type { TableVariants } from "@ropav/styles";
