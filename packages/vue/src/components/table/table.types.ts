import type {CollectionKey} from "../../composables/use-collection";
import type {TableVariants} from "@heroui/styles";

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
}

export interface TableHeaderProps {
  class?: string;
}

export interface TableColumnProps {
  class?: string;
  /** Identity of the column. Falls back to a generated key. */
  id?: CollectionKey;
  /**
   * Whether cells under this column name their row. Declared as `boolean` rather than through
   * the variants type, so Vue casts a bare `is-row-header` attribute instead of reading `""`.
   */
  isRowHeader?: boolean;
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
}

export interface TableCellProps {
  class?: string;
  /** Text this cell contributes to its row's text value. Derived from its content when absent. */
  textValue?: string;
}

export interface TableFooterProps {
  class?: string;
}

export type TableSortDirection = "ascending" | "descending";

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
