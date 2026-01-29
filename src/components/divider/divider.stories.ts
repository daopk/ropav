import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Divider from './divider.vue';

const meta = {
    title: 'Components/Divider',
    component: Divider as any,
    tags: ['autodocs'],
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
        labelPosition: {
            control: 'select',
            options: ['start', 'center', 'end'],
        },
        label: { control: 'text' },
    },
    args: {
        orientation: 'horizontal',
        labelPosition: 'center',
    },
    render: (args) => ({
        components: { Divider },
        setup: () => ({ args }),
        template: '<Divider v-bind="args" />',
    }),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: { label: 'OR' },
};

export const LabelPositions: Story = {
    render: () => ({
        components: { Divider },
        template: `
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <Divider label="Start" label-position="start" />
                <Divider label="Center" label-position="center" />
                <Divider label="End" label-position="end" />
            </div>
        `,
    }),
};

export const Vertical: Story = {
    render: () => ({
        components: { Divider },
        template: `
            <div style="display: flex; align-items: center; gap: 12px; height: 40px;">
                <span>Left</span>
                <Divider orientation="vertical" />
                <span>Right</span>
            </div>
        `,
    }),
};
