import {
    createTable,
    functionalUpdate,
    getCoreRowModel,
    getSortedRowModel,
    type ColumnDef,
    type Row,
    type SortingFn,
    type Table as TanStackTable,
    type TableOptionsResolved,
    type SortingState as TanStackSortingState,
    type Updater,
} from '@tanstack/table-core';
import { computed, shallowRef, triggerRef, watchEffect, type ComputedRef } from 'vue';
import { useControllableValue } from 'ropav/composables';

import type {
    TableCellContent,
    TableCellSlotProps,
    TableColumn,
    TableHeaderSlotProps,
    TableSortingState,
} from './types';

export interface TableViewColumn<TData> {
    readonly id: string;
    readonly align: TableColumn<TData>['align'];
    readonly width: TableColumn<TData>['width'];
    readonly headerSlotProps: TableHeaderSlotProps<TData>;
}

export interface TableViewCell<TData> {
    readonly id: string;
    readonly column: TableViewColumn<TData>;
    readonly content: TableCellContent;
    readonly slotProps: TableCellSlotProps<TData>;
}

export interface TableViewRow<TData> {
    readonly id: string;
    readonly cells: readonly TableViewCell<TData>[];
}

export interface UseTableOptions<TData> {
    data: () => readonly TData[];
    columns: () => readonly TableColumn<TData>[];
    sorting: () => TableSortingState | undefined;
    defaultSorting: () => TableSortingState;
    getRowId: () => ((row: TData, rowIndex: number) => string) | undefined;
    manualSorting: () => boolean;
    multiSort: () => boolean;
    onSortingChange: (sorting: TableSortingState) => void;
}

export interface UseTableReturn<TData> {
    columns: ComputedRef<readonly TableViewColumn<TData>[]>;
    rows: ComputedRef<readonly TableViewRow<TData>[]>;
    clearSorting: () => void;
}

export function useTable<TData>(options: Readonly<UseTableOptions<TData>>): UseTableReturn<TData> {
    const controllableSorting = useControllableValue<TableSortingState>({
        modelValue: options.sorting,
        defaultValue: options.defaultSorting,
        onChange: options.onSortingChange,
    });
    const tableVersion = shallowRef({});
    let sourceColumns = new Map<string, TableColumn<TData>>();
    const table = createCoreTable(options, applySortingUpdate);

    watchEffect(
        () => {
            const resolvedColumns = resolveTableColumns(options.columns());
            sourceColumns = new Map(resolvedColumns.sourceById);
            table.setOptions((current) => ({
                ...current,
                data: [...options.data()],
                columns: resolvedColumns.definitions,
                state: {
                    ...table.initialState,
                    ...current.state,
                    sorting: cloneSorting(controllableSorting.value.value),
                },
                getRowId: options.getRowId(),
                manualSorting: options.manualSorting(),
                enableMultiSort: options.multiSort(),
            }));
            triggerRef(tableVersion);
        },
        { flush: 'sync' },
    );

    const columns = computed(() => {
        void tableVersion.value;
        return table.getAllLeafColumns().map((column) => {
            const source = getSourceColumn(sourceColumns, column.id);
            const sortable = column.getCanSort();
            const sorted = column.getIsSorted();
            const sortIndex = column.getSortIndex();
            const toggle = (multi?: boolean) => toggleSorting(column.id, multi);

            return {
                id: column.id,
                align: source.align,
                width: source.width,
                headerSlotProps: {
                    column: source,
                    id: column.id,
                    label: source.header,
                    sortable,
                    sorted,
                    sortIndex,
                    toggle,
                },
            };
        });
    });
    const columnsById = computed(() => new Map(columns.value.map((column) => [column.id, column])));
    const rows = computed(() => {
        void tableVersion.value;
        return table.getRowModel().rows.map((row) => {
            const viewColumns = columnsById.value;
            return {
                id: row.id,
                cells: row.getVisibleCells().map((cell) => {
                    const column = getViewColumn(viewColumns, cell.column.id);
                    const source = getSourceColumn(sourceColumns, cell.column.id);
                    const value = cell.getValue();
                    return {
                        id: cell.id,
                        column,
                        content: formatTableCell(source, value, row.original, row.index),
                        slotProps: {
                            column: source,
                            columnId: column.id,
                            row: row.original,
                            rowId: row.id,
                            rowIndex: row.index,
                            value,
                        },
                    };
                }),
            };
        });
    });

    function applySortingUpdate(updater: Updater<TanStackSortingState>) {
        const nextSorting = functionalUpdate(
            updater,
            cloneSorting(controllableSorting.value.value),
        );
        controllableSorting.setValue(cloneSorting(nextSorting));
    }

    function clearSorting() {
        controllableSorting.setValue([]);
    }

    function toggleSorting(columnId: string, multi = false) {
        table.getColumn(columnId)?.toggleSorting(undefined, options.multiSort() && multi);
    }

    return {
        columns,
        rows,
        clearSorting,
    };
}

interface ResolvedTableColumns<TData> {
    readonly definitions: ColumnDef<TData, unknown>[];
    readonly sourceById: ReadonlyMap<string, TableColumn<TData>>;
}

function resolveTableColumns<TData>(
    columns: readonly TableColumn<TData>[],
): ResolvedTableColumns<TData> {
    const sourceById = new Map<string, TableColumn<TData>>();
    const definitions = columns.map((column) => {
        const id = resolveColumnId(column);
        if (sourceById.has(id)) throw new Error(`Duplicate table column id ${JSON.stringify(id)}`);

        sourceById.set(id, column);
        return createColumnDefinition(column, id);
    });

    return { definitions, sourceById };
}

function resolveColumnId<TData>(column: TableColumn<TData>) {
    if (column.id) return column.id;
    if (column.accessorKey) return column.accessorKey;
    throw new Error('A table column without accessorKey must define an id');
}

function createColumnDefinition<TData>(
    column: TableColumn<TData>,
    id: string,
): ColumnDef<TData, unknown> {
    const accessor = getColumnAccessor(column);
    return {
        id,
        accessorFn: accessor,
        enableSorting: column.sortable ?? accessor !== undefined,
        sortDescFirst: column.sortDescFirst,
        sortUndefined: column.sortUndefined,
        sortingFn: column.compare ? createSortingFunction(column.compare) : 'auto',
    };
}

function getColumnAccessor<TData>(column: TableColumn<TData>) {
    if (column.accessor) return column.accessor;
    if (!column.accessorKey) return undefined;

    return (row: TData) => row[column.accessorKey as keyof TData];
}

function createSortingFunction<TData>(
    compare: NonNullable<TableColumn<TData>['compare']>,
): SortingFn<TData> {
    return (left: Row<TData>, right: Row<TData>, columnId: string) =>
        compare(left.getValue(columnId), right.getValue(columnId), left.original, right.original);
}

function formatTableCell<TData>(
    column: TableColumn<TData>,
    value: unknown,
    row: TData,
    rowIndex: number,
): TableCellContent {
    if (column.format) return column.format(value, row, rowIndex);
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean' || typeof value === 'bigint') return String(value);
    if (value instanceof Date) return value.toISOString();
    return '';
}

function createCoreTable<TData>(
    options: Readonly<UseTableOptions<TData>>,
    onSortingChange: (updater: Updater<TanStackSortingState>) => void,
): TanStackTable<TData> {
    const resolvedColumns = resolveTableColumns(options.columns());
    const tableOptions: TableOptionsResolved<TData> = {
        data: [...options.data()],
        columns: resolvedColumns.definitions,
        state: { sorting: cloneSorting(options.sorting() ?? options.defaultSorting()) },
        onStateChange: () => undefined,
        onSortingChange,
        renderFallbackValue: null,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: options.getRowId(),
        manualSorting: options.manualSorting(),
        enableMultiSort: options.multiSort(),
    };
    return createTable(tableOptions);
}

function cloneSorting(sorting: TableSortingState) {
    return sorting.map((sort) => ({ id: sort.id, desc: sort.desc }));
}

function getSourceColumn<TData>(
    columns: ReadonlyMap<string, TableColumn<TData>>,
    columnId: string,
) {
    const column = columns.get(columnId);
    if (!column) throw new Error(`Unknown table column ${JSON.stringify(columnId)}`);
    return column;
}

function getViewColumn<TData>(
    columns: ReadonlyMap<string, TableViewColumn<TData>>,
    columnId: string,
) {
    const column = columns.get(columnId);
    if (!column) throw new Error(`Unknown table view column ${JSON.stringify(columnId)}`);
    return column;
}
