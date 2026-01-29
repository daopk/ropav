import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Pagination from './pagination.vue';
import { ref } from 'vue';

const meta = {
    title: 'Components/Pagination',
    component: Pagination as any,
    tags: ['autodocs'],
    argTypes: {
        total: { control: 'number' },
        pageSize: { control: 'number' },
        siblingCount: { control: 'number' },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        disabled: { control: 'boolean' },
    },
    args: {
        total: 100,
        pageSize: 10,
        siblingCount: 1,
        size: 'md',
        disabled: false,
    },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => ({
        components: { Pagination },
        setup() {
            const page = ref(1);
            return { args, page };
        },
        template: '<Pagination v-bind="args" v-model="page" />',
    }),
};

export const ManyPages: Story = {
    args: { total: 500, pageSize: 10 },
    render: (args) => ({
        components: { Pagination },
        setup() {
            const page = ref(25);
            return { args, page };
        },
        template: '<Pagination v-bind="args" v-model="page" />',
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Pagination },
        setup() {
            const p1 = ref(1);
            const p2 = ref(1);
            const p3 = ref(1);
            return { p1, p2, p3 };
        },
        template: `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <Pagination :total="100" size="sm" v-model="p1" />
                <Pagination :total="100" size="md" v-model="p2" />
                <Pagination :total="100" size="lg" v-model="p3" />
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
    render: (args) => ({
        components: { Pagination },
        setup() {
            const page = ref(3);
            return { args, page };
        },
        template: '<Pagination v-bind="args" v-model="page" />',
    }),
};
