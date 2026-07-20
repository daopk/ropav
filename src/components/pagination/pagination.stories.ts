import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Pagination from './pagination.vue';
import { paginationColors, paginationRadiuses, paginationSizes } from './types';

const meta = {
    title: 'Components/Pagination',
    component: Pagination as any,
    tags: ['autodocs'],
    argTypes: {
        modelValue: { control: false },
        defaultValue: { control: 'number' },
        total: { control: { type: 'number', min: 0 } },
        siblings: { control: { type: 'number', min: 0 } },
        boundaries: { control: { type: 'number', min: 0 } },
        withControls: { control: 'boolean' },
        withEdges: { control: 'boolean' },
        disabled: { control: 'boolean' },
        color: { control: 'text' },
        autoContrast: { control: 'boolean' },
        size: { control: 'select', options: paginationSizes },
        radius: { control: 'select', options: paginationRadiuses },
        getPageAriaLabel: { control: false },
    },
    args: {
        defaultValue: 6,
        total: 20,
        siblings: 1,
        boundaries: 1,
        withControls: true,
        withEdges: false,
        disabled: false,
        color: undefined,
        autoContrast: false,
        size: 'md',
        radius: 'sm',
    },
    render: (args) => ({
        components: { Pagination },
        setup() {
            const page = ref(args.defaultValue ?? 1);
            return { args, page };
        },
        template: '<Pagination v-bind="args" v-model="page" />',
    }),
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEdges: Story = {
    args: { withEdges: true },
};

export const Compact: Story = {
    args: { boundaries: 0, siblings: 0, total: 50 },
};

export const Colors: Story = {
    render: (args) => ({
        components: { Pagination },
        setup: () => ({ args, paginationColors }),
        template: `
            <div style="display: grid; gap: 16px;">
                <Pagination
                    v-for="color in paginationColors"
                    :key="color"
                    v-bind="args"
                    :color="color"
                    :total="8"
                    :default-value="4"
                />
            </div>
        `,
    }),
};

export const Sizes: Story = {
    render: (args) => ({
        components: { Pagination },
        setup: () => ({ args, paginationSizes }),
        template: `
            <div style="display: grid; gap: 16px;">
                <Pagination
                    v-for="size in paginationSizes"
                    :key="size"
                    v-bind="args"
                    :size="size"
                    :total="8"
                    :default-value="4"
                />
            </div>
        `,
    }),
};

export const CustomPage: Story = {
    render: (args) => ({
        components: { Pagination },
        setup: () => ({ args }),
        template: `
            <Pagination v-bind="args">
                <template #page="{ page, active }">
                    {{ active ? '[' + page + ']' : page }}
                </template>
            </Pagination>
        `,
    }),
};
