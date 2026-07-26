<template>
    <div v-bind="rootAttrs">
        <table ref="nativeElement" v-bind="tableAttrs">
            <caption v-if="hasCaption" v-bind="getPartAttrs('caption', 'rp-table__caption')">
                <slot name="caption">{{ caption }}</slot>
            </caption>

            <thead v-bind="getPartAttrs('head', 'rp-table__head')">
                <tr v-bind="getPartAttrs('headRow', 'rp-table__head-row')">
                    <th
                        v-for="column in viewColumns"
                        :key="column.id"
                        v-bind="getColumnAttrs('header', 'rp-table__header', column)"
                        scope="col"
                        :aria-sort="getAriaSort(column)"
                    >
                        <slot name="header" v-bind="column.headerSlotProps">
                            <button
                                v-if="column.headerSlotProps.sortable"
                                v-bind="getPartAttrs('sortButton', 'rp-table__sort-button')"
                                type="button"
                                @click="column.headerSlotProps.toggle($event.shiftKey)"
                            >
                                <span>{{ column.headerSlotProps.label }}</span>
                                <span
                                    v-bind="
                                        getPartAttrs('sortIndicator', 'rp-table__sort-indicator')
                                    "
                                    aria-hidden="true"
                                >
                                    {{ getSortIndicator(column) }}
                                </span>
                            </button>
                            <template v-else>{{ column.headerSlotProps.label }}</template>
                        </slot>
                    </th>
                </tr>
            </thead>

            <tbody v-bind="getPartAttrs('body', 'rp-table__body')">
                <tr
                    v-if="loading"
                    v-bind="getPartAttrs('row', 'rp-table__row')"
                    data-status="loading"
                >
                    <td v-bind="getPartAttrs('status', 'rp-table__status')" :colspan="columnCount">
                        <slot name="loading">{{ loadingText }}</slot>
                    </td>
                </tr>
                <tr
                    v-else-if="viewRows.length === 0"
                    v-bind="getPartAttrs('row', 'rp-table__row')"
                    data-status="empty"
                >
                    <td v-bind="getPartAttrs('status', 'rp-table__status')" :colspan="columnCount">
                        <slot name="empty">{{ emptyText }}</slot>
                    </td>
                </tr>
                <template v-else>
                    <tr
                        v-for="row in viewRows"
                        :key="row.id"
                        v-bind="getPartAttrs('row', 'rp-table__row')"
                        :data-row-id="row.id"
                    >
                        <td
                            v-for="cell in row.cells"
                            :key="cell.id"
                            v-bind="getColumnAttrs('cell', 'rp-table__cell', cell.column)"
                        >
                            <slot name="cell" v-bind="cell.slotProps">
                                {{ cell.content }}
                            </slot>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts" vapor generic="TData extends object = Record<string, unknown>">
import { computed, shallowRef, useAttrs } from 'vue';

import { useTable, type TableViewColumn } from './useTable';
import type {
    TableCellSlotProps,
    TableHeaderSlotProps,
    TablePart,
    TableProps,
    TableSortingState,
} from './types';

defineOptions({ name: 'RpTable', inheritAttrs: false });

const props = withDefaults(defineProps<TableProps<TData>>(), {
    sorting: undefined,
    defaultSorting: () => [],
    getRowId: undefined,
    manualSorting: false,
    multiSort: false,
    loading: false,
    caption: '',
    emptyText: 'No data',
    loadingText: 'Loading',
    ariaLabel: undefined,
    labelledby: undefined,
    describedby: undefined,
});

const emit = defineEmits<{
    'update:sorting': [sorting: TableSortingState];
    'sorting-change': [sorting: TableSortingState];
}>();

const slots = defineSlots<{
    caption?(): unknown;
    header?(props: TableHeaderSlotProps<TData>): unknown;
    cell?(props: TableCellSlotProps<TData>): unknown;
    empty?(): unknown;
    loading?(): unknown;
}>();

const attrs = useAttrs();
const nativeElement = shallowRef<HTMLTableElement | null>(null);
const {
    columns: viewColumns,
    rows: viewRows,
    clearSorting,
} = useTable({
    data: () => props.data,
    columns: () => props.columns,
    sorting: () => props.sorting,
    defaultSorting: () => props.defaultSorting,
    getRowId: () => props.getRowId,
    manualSorting: () => props.manualSorting,
    multiSort: () => props.multiSort,
    onSortingChange(sorting) {
        emit('update:sorting', sorting);
        emit('sorting-change', sorting);
    },
});

const hasCaption = computed(() => Boolean(slots.caption || props.caption));
const columnCount = computed(() => Math.max(1, viewColumns.value.length));
const rootAttrs = computed(() => ({
    ...attrs,
    class: ['rp-table', props.classNames?.root, attrs.class],
    style: [props.styles?.root, attrs.style],
}));
const tableAttrs = computed(() => ({
    ...getPartAttrs('table', 'rp-table__table'),
    'aria-busy': props.loading || undefined,
    'aria-label': props.ariaLabel,
    'aria-labelledby': props.labelledby,
    'aria-describedby': props.describedby,
}));

function getPartAttrs(part: TablePart, className: string) {
    return {
        class: [className, props.classNames?.[part]],
        style: props.styles?.[part],
    };
}

function getColumnAttrs(
    part: 'header' | 'cell',
    className: string,
    column: TableViewColumn<TData>,
) {
    return {
        ...getPartAttrs(part, className),
        style: [
            props.styles?.[part],
            column.width === undefined ? undefined : { width: column.width },
        ],
        'data-align': column.align,
        'data-column-id': column.id,
    };
}

function getAriaSort(column: TableViewColumn<TData>) {
    if (!column.headerSlotProps.sortable) return undefined;
    if (column.headerSlotProps.sorted === 'asc') return 'ascending' as const;
    if (column.headerSlotProps.sorted === 'desc') return 'descending' as const;
    return 'none' as const;
}

function getSortIndicator(column: TableViewColumn<TData>) {
    if (column.headerSlotProps.sorted === 'asc') return '▲';
    if (column.headerSlotProps.sorted === 'desc') return '▼';
    return '↕';
}

defineExpose({ nativeElement, clearSorting });
</script>

<style src="./table.css" scoped></style>
