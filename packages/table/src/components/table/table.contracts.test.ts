import { defineComponent, h, nextTick, type Component } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { mountDomWithApp } from '../../../tests/utils/vue';
import Table from './table.vue';
import type { TableColumn, TableProps, TableSortingState } from './types';

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
    { accessorKey: 'age', header: 'Age' },
    { accessorKey: 'id', header: 'Identifier' },
];
type PersonTableProps = Parameters<typeof Table<Person>>[0];

function mountTable(props: Record<string, unknown> = {}) {
    return mountDomWithApp(
        defineComponent({
            render() {
                return h(Table as Component, {
                    data: people,
                    columns,
                    getRowId: (person: Person) => person.id,
                    ...props,
                });
            },
        }),
    );
}

describe('Table public contracts', () => {
    it('routes native table labelling attributes through camelized public props', () => {
        const accessibilityProps = {
            ariaLabelledby: 'people-title',
            ariaDescribedby: 'people-description',
        } satisfies Partial<TableProps<Person>>;
        const { container } = mountTable({
            'aria-labelledby': accessibilityProps.ariaLabelledby,
            'aria-describedby': accessibilityProps.ariaDescribedby,
        });
        const root = container.querySelector('.rp-table');
        const table = container.querySelector('table');

        expect(root?.getAttribute('aria-labelledby')).toBeNull();
        expect(root?.getAttribute('aria-describedby')).toBeNull();
        expect(table?.getAttribute('aria-labelledby')).toBe('people-title');
        expect(table?.getAttribute('aria-describedby')).toBe('people-description');
    });

    it('exposes aria-sort only on the primary sort and communicates every sort priority', () => {
        const { container } = mountTable({
            multiSort: true,
            defaultSorting: [
                { id: 'name', desc: false },
                { id: 'age', desc: true },
            ] satisfies TableSortingState,
        });
        const nameHeader = container.querySelector('[data-column-id="name"]');
        const ageHeader = container.querySelector('[data-column-id="age"]');
        const identifierHeader = container.querySelector('[data-column-id="id"]');
        const nameButton = nameHeader?.querySelector('button');
        const ageButton = ageHeader?.querySelector('button');

        expect(nameHeader?.getAttribute('aria-sort')).toBe('ascending');
        expect(ageHeader?.getAttribute('aria-sort')).toBeNull();
        expect(identifierHeader?.getAttribute('aria-sort')).toBeNull();
        expect(nameButton?.querySelector('.rp-table__sort-indicator')?.textContent?.trim()).toBe(
            '▲ 1',
        );
        expect(ageButton?.querySelector('.rp-table__sort-indicator')?.textContent?.trim()).toBe(
            '▼ 2',
        );
        expect(nameButton?.getAttribute('aria-label')).toBe(
            'Name, sorted ascending, sort priority 1',
        );
        expect(ageButton?.getAttribute('aria-label')).toBe(
            'Age, sorted descending, sort priority 2',
        );
    });

    it('types and emits the camelized sortingChange listener', async () => {
        const onSortingChange = vi.fn<(sorting: TableSortingState) => void>();
        const typedListener: NonNullable<PersonTableProps['onSortingChange']> = (sorting) => {
            onSortingChange(sorting);
        };
        const { container } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(Table as Component, {
                        data: people,
                        columns,
                        getRowId: (person: Person) => person.id,
                        onSortingChange: typedListener,
                    });
                },
            }),
        );

        container.querySelector<HTMLButtonElement>('[data-column-id="name"] button')?.click();
        await nextTick();

        expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'name', desc: false }]);
    });
});
