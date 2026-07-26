import type { StylesApiProps } from 'ropav';
import type { CSSProperties } from 'vue';

export const tableParts = [
    'root',
    'table',
    'caption',
    'head',
    'headRow',
    'header',
    'sortButton',
    'sortIndicator',
    'body',
    'row',
    'cell',
    'status',
] as const;
export type TablePart = (typeof tableParts)[number];

export type TableAlignment = 'start' | 'center' | 'end';
export type TableCellContent = string | number | null | undefined;
export type TableSortDirection = 'asc' | 'desc';
export type TableAccessorKey<TData> = Extract<keyof TData, string>;

export interface TableSort {
    readonly id: string;
    readonly desc: boolean;
}

export type TableSortingState = readonly TableSort[];

interface TableColumnOptions<TData> {
    header: string;
    align?: TableAlignment;
    width?: CSSProperties['width'];
    sortable?: boolean;
    sortDescFirst?: boolean;
    sortUndefined?: false | 'first' | 'last';
    compare?: (leftValue: unknown, rightValue: unknown, leftRow: TData, rightRow: TData) => number;
    format?: (value: unknown, row: TData, rowIndex: number) => TableCellContent;
}

export type TableColumn<TData> = TableColumnOptions<TData> &
    (
        | {
              id?: string;
              accessorKey: TableAccessorKey<TData>;
              accessor?: never;
          }
        | {
              id: string;
              accessor: (row: TData, rowIndex: number) => unknown;
              accessorKey?: never;
          }
        | {
              id: string;
              accessor?: never;
              accessorKey?: never;
              sortable?: false;
          }
    );

export interface TableProps<TData> extends StylesApiProps<TablePart> {
    data: readonly TData[];
    columns: readonly TableColumn<TData>[];
    sorting?: TableSortingState;
    defaultSorting?: TableSortingState;
    getRowId?: (row: TData, rowIndex: number) => string;
    manualSorting?: boolean;
    multiSort?: boolean;
    loading?: boolean;
    caption?: string;
    emptyText?: string;
    loadingText?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
}

export interface TableHeaderSlotProps<TData> {
    readonly column: TableColumn<TData>;
    readonly id: string;
    readonly label: string;
    readonly sortable: boolean;
    readonly sorted: false | TableSortDirection;
    readonly sortIndex: number;
    toggle: (multi?: boolean) => void;
}

export interface TableCellSlotProps<TData> {
    readonly column: TableColumn<TData>;
    readonly columnId: string;
    readonly row: TData;
    readonly rowId: string;
    readonly rowIndex: number;
    readonly value: unknown;
}

export interface TableComponentExposed {
    readonly nativeElement: HTMLTableElement | null;
    clearSorting: () => void;
}
