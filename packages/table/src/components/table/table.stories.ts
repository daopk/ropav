import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ref } from 'vue';

import Table from './table.vue';
import type { TableColumn, TableSortingState } from './types';

interface Person {
    id: string;
    name: string;
    role: string;
    joined: string;
}

const people: Person[] = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Engineer', joined: '1843-01-01' },
    { id: 'grace', name: 'Grace Hopper', role: 'Admiral', joined: '1943-01-01' },
    { id: 'katherine', name: 'Katherine Johnson', role: 'Mathematician', joined: '1953-01-01' },
];
const columns: TableColumn<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'role', header: 'Role' },
    {
        accessorKey: 'joined',
        header: 'Joined',
        format: (value) =>
            new Intl.DateTimeFormat('en', { year: 'numeric' }).format(new Date(String(value))),
    },
];

const meta = {
    title: 'Components/Data Display/Table',
    component: Table as any,
    tags: ['autodocs'],
    args: {
        data: people,
        columns,
        ariaLabel: 'People',
        loading: false,
        emptyText: 'No people found',
        loadingText: 'Loading people',
    },
    argTypes: {
        data: { control: false },
        columns: { control: false },
        sorting: { control: false },
        defaultSorting: { control: false },
        getRowId: { control: false },
        manualSorting: { control: 'boolean' },
        multiSort: { control: 'boolean' },
        classNames: { control: false },
        styles: { control: false },
    },
    render: (args) => ({
        components: { Table },
        setup() {
            const sorting = ref<TableSortingState>([]);
            return { args, sorting };
        },
        template: `
            <Table
                v-bind="args"
                v-model:sorting="sorting"
                :get-row-id="(person) => person.id"
            />
        `,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    tags: ['test'],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const nameSort = canvas.getByRole('button', { name: /Name/ });

        await userEvent.click(nameSort);

        await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Ada Lovelace');
        await expect(nameSort.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    },
};

export const CustomCells: Story = {
    render: (args) => ({
        components: { Table },
        setup() {
            return { args };
        },
        template: `
            <Table v-bind="args" :get-row-id="(person) => person.id">
                <template #cell="{ columnId, row, value }">
                    <a
                        v-if="columnId === 'name'"
                        :href="'#' + row.id"
                        style="color: var(--rp-primary-color-light-color)"
                    >
                        {{ value }}
                    </a>
                    <template v-else>{{ value }}</template>
                </template>
            </Table>
        `,
    }),
};

export const Loading: Story = {
    args: {
        loading: true,
    },
};

export const Empty: Story = {
    args: {
        data: [],
    },
};
