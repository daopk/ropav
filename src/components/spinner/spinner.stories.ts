import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Spinner from './spinner.vue';

const meta = {
    title: 'Components/Spinner',
    component: Spinner as any,
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        color: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'warning', 'danger', 'current'],
        },
    },
    args: {
        size: 'md',
        color: 'primary',
    },
    render: (args) => ({
        components: { Spinner },
        setup: () => ({ args }),
        template: '<Spinner v-bind="args" />',
    }),
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
    render: () => ({
        components: { Spinner },
        template: `
            <div style="display: flex; gap: 16px; align-items: center;">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
            </div>
        `,
    }),
};

export const Colors: Story = {
    render: () => ({
        components: { Spinner },
        template: `
            <div style="display: flex; gap: 16px; align-items: center;">
                <Spinner color="primary" />
                <Spinner color="secondary" />
                <Spinner color="success" />
                <Spinner color="warning" />
                <Spinner color="danger" />
            </div>
        `,
    }),
};

export const InheritColor: Story = {
    render: () => ({
        components: { Spinner },
        template: `
            <div style="color: #e11d48; display: flex; align-items: center; gap: 8px;">
                <Spinner color="current" size="sm" />
                <span>Loading...</span>
            </div>
        `,
    }),
};
