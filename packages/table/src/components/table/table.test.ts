import { defineComponent, h, nextTick, type Component } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { mountDomWithApp } from '../../../tests/utils/vue';
import Table from './table.vue';
import type {
    TableCellSlotProps,
    TableColumn,
    TableHeaderSlotProps,
    TableSortingState,
} from './types';

interface Person {
    id: string;
    name: string;
    age: number;
}

const people: Person[] = [
    { id: 'grace', name: 'Grace Hopper', age: 85 },
    { id: 'ada', name: 'Ada Lovelace', age: 36 },
];
const columns: TableColumn<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
        accessorKey: 'age',
        header: 'Age',
        align: 'end',
        format: (value) => `${String(value)} years`,
    },
    { id: 'actions', header: 'Actions', sortable: false },
];

interface TableTestSlots {
    [name: string]: ((props: never) => unknown) | undefined;
    header?: (props: TableHeaderSlotProps<Person>) => unknown;
    cell?: (props: TableCellSlotProps<Person>) => unknown;
}

function mountTable(props: Record<string, unknown> = {}, slots: TableTestSlots = {}) {
    return mountDomWithApp(
        defineComponent({
            render() {
                return h(
                    Table as Component,
                    {
                        data: people,
                        columns,
                        getRowId: (person: Person) => person.id,
                        ...props,
                    },
                    slots,
                );
            },
        }),
    );
}

function getRenderedNames(container: Element) {
    return [...container.querySelectorAll('tbody tr:not([data-status])')].map((row) =>
        row.querySelector('td')?.textContent?.trim(),
    );
}

describe('Table', () => {
    it('renders semantic headers, formatted cells, and stable row ids', () => {
        const { container } = mountTable({ ariaLabel: 'People' });

        expect(container.querySelector('table')?.getAttribute('aria-label')).toBe('People');
        expect(
            [...container.querySelectorAll('th')].map((header) =>
                header.textContent?.replace(/[↕▲▼]/g, '').trim(),
            ),
        ).toEqual(['Name', 'Age', 'Actions']);
        expect(container.querySelector('[data-row-id="grace"]')?.textContent).toContain('85 years');
        expect(container.querySelector('[data-column-id="age"]')?.getAttribute('data-align')).toBe(
            'end',
        );
    });

    it('formats supported values through rendered table behavior', () => {
        interface RecordRow {
            id: string;
            active: boolean;
            createdAt: Date;
            metadata: { nested: boolean };
        }

        const record = {
            id: 'record',
            active: true,
            createdAt: new Date('2026-07-27T00:00:00.000Z'),
            metadata: { nested: true },
        };
        const recordColumns: TableColumn<RecordRow>[] = [
            { accessorKey: 'active', header: 'Active' },
            { accessorKey: 'createdAt', header: 'Created' },
            { accessorKey: 'metadata', header: 'Metadata' },
            {
                id: 'summary',
                accessor: (row) => `${row.id}:${String(row.active)}`,
                header: 'Summary',
            },
        ];
        const { container } = mountTable({
            data: [record],
            columns: recordColumns,
            getRowId: (row: RecordRow) => row.id,
        });

        expect(
            [...container.querySelectorAll('tbody td')].map((cell) => cell.textContent?.trim()),
        ).toEqual(['true', '2026-07-27T00:00:00.000Z', '', 'record:true']);
    });

    it('rejects duplicate column ids through the Table interface', () => {
        const duplicateColumns: TableColumn<Person>[] = [
            { accessorKey: 'name', header: 'Name' },
            { id: 'name', accessor: (person) => person.id, header: 'Identifier' },
        ];

        expect(() => mountTable({ columns: duplicateColumns })).toThrow(
            'Duplicate table column id "name"',
        );
    });

    it('exposes header and cell behavior through slot props', async () => {
        const header = vi.fn((slotProps: TableHeaderSlotProps<Person>) =>
            h(
                'button',
                {
                    class: 'custom-header',
                    onClick: () => slotProps.toggle(),
                },
                slotProps.label,
            ),
        );
        const cell = vi.fn(
            ({ columnId, row, value }: TableCellSlotProps<Person>) =>
                `${columnId}:${row.id}:${String(value ?? '')}`,
        );
        const { container } = mountTable({}, { header, cell });

        container.querySelector<HTMLButtonElement>('[data-column-id="name"] button')?.click();
        await nextTick();

        expect(header).toHaveBeenCalled();
        expect(cell).toHaveBeenCalled();
        expect(container.querySelector('[data-column-id="name"]')?.getAttribute('aria-sort')).toBe(
            'ascending',
        );
        expect(getRenderedNames(container)).toEqual([
            'name:ada:Ada Lovelace',
            'name:grace:Grace Hopper',
        ]);
    });

    it('sorts rows and emits an observable sorting model', async () => {
        const update = vi.fn();
        const change = vi.fn();
        const { container } = mountTable({
            'onUpdate:sorting': update,
            onSortingChange: change,
        });
        const nameHeader = container.querySelector('[data-column-id="name"]');
        const sortButton = nameHeader?.querySelector('button');

        sortButton?.click();
        await nextTick();

        expect(getRenderedNames(container)).toEqual(['Ada Lovelace', 'Grace Hopper']);
        expect(nameHeader?.getAttribute('aria-sort')).toBe('ascending');
        expect(update).toHaveBeenLastCalledWith([{ id: 'name', desc: false }]);
        expect(change).toHaveBeenLastCalledWith([{ id: 'name', desc: false }]);

        sortButton?.click();
        await nextTick();

        expect(getRenderedNames(container)).toEqual(['Grace Hopper', 'Ada Lovelace']);
        expect(nameHeader?.getAttribute('aria-sort')).toBe('descending');
    });

    it('keeps controlled sorting authoritative when an update is rejected', async () => {
        const update = vi.fn();
        const sorting: TableSortingState = [{ id: 'name', desc: false }];
        const { container } = mountTable({
            sorting,
            'onUpdate:sorting': update,
        });
        const sortButton = container.querySelector<HTMLButtonElement>(
            '[data-column-id="name"] button',
        );

        expect(getRenderedNames(container)).toEqual(['Ada Lovelace', 'Grace Hopper']);

        sortButton?.click();
        await nextTick();

        expect(update).toHaveBeenLastCalledWith([{ id: 'name', desc: true }]);
        expect(getRenderedNames(container)).toEqual(['Ada Lovelace', 'Grace Hopper']);
    });

    it('emits manual sorting without changing server-owned row order', async () => {
        const update = vi.fn();
        const { container } = mountTable({
            manualSorting: true,
            'onUpdate:sorting': update,
        });

        container.querySelector<HTMLButtonElement>('[data-column-id="name"] button')?.click();
        await nextTick();

        expect(update).toHaveBeenLastCalledWith([{ id: 'name', desc: false }]);
        expect(getRenderedNames(container)).toEqual(['Grace Hopper', 'Ada Lovelace']);
    });

    it('renders loading and empty states with the correct table semantics', () => {
        const loading = mountTable({ loading: true, loadingText: 'Fetching people' });
        const loadingCell = loading.container.querySelector('[data-status="loading"] td');

        expect(loading.container.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
        expect(loadingCell?.textContent).toContain('Fetching people');
        expect(loadingCell?.getAttribute('colspan')).toBe('3');

        loading.unmount();
        const empty = mountTable({ data: [], emptyText: 'Nobody here' });

        expect(empty.container.querySelector('[data-status="empty"]')?.textContent).toContain(
            'Nobody here',
        );
    });

    it('applies styles API values to root and repeated parts', () => {
        const { container } = mountTable({
            classNames: {
                root: 'custom-root',
                cell: 'custom-cell',
            },
            styles: {
                header: { minWidth: '8rem' },
            },
        });

        expect(container.querySelector('.rp-table')?.classList).toContain('custom-root');
        expect(container.querySelector('td')?.classList).toContain('custom-cell');
        expect(container.querySelector('th')?.getAttribute('style')).toContain('min-width: 8rem');
    });
});
