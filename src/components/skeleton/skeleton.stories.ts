import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Skeleton from './skeleton.vue';

const meta = {
    title: 'Components/Skeleton',
    component: Skeleton as any,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['text', 'circular', 'rectangular'],
        },
        width: { control: 'text' },
        height: { control: 'text' },
        animate: { control: 'boolean' },
    },
    args: {
        variant: 'text',
        animate: true,
    },
    render: (args) => ({
        components: { Skeleton },
        setup: () => ({ args }),
        template: '<Skeleton v-bind="args" />',
    }),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
    render: () => ({
        components: { Skeleton },
        template: `
            <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="circular" />
                <Skeleton variant="rectangular" />
            </div>
        `,
    }),
};

export const CardPlaceholder: Story = {
    render: () => ({
        components: { Skeleton },
        template: `
            <div style="display: flex; gap: 16px; align-items: flex-start; max-width: 400px;">
                <Skeleton variant="circular" width="48px" height="48px" />
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
        `,
    }),
};

export const NoAnimation: Story = {
    args: { animate: false },
};
