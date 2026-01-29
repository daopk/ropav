import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Tooltip from './tooltip.vue';

const meta = {
    title: 'Components/Tooltip',
    component: Tooltip as any,
    tags: ['autodocs'],
    argTypes: {
        content: { control: 'text' },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
        },
        delay: { control: 'number' },
        disabled: { control: 'boolean' },
    },
    args: {
        content: 'Tooltip text',
        placement: 'top',
        delay: 200,
        disabled: false,
    },
    render: (args) => ({
        components: { Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="padding: 60px; display: flex; justify-content: center;">
                <Tooltip v-bind="args">
                    <button style="padding: 8px 16px;">Hover me</button>
                </Tooltip>
            </div>
        `,
    }),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placements: Story = {
    render: () => ({
        components: { Tooltip },
        template: `
            <div style="padding: 80px; display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;">
                <Tooltip content="Top tooltip" placement="top">
                    <button style="padding: 8px 16px;">Top</button>
                </Tooltip>
                <Tooltip content="Bottom tooltip" placement="bottom">
                    <button style="padding: 8px 16px;">Bottom</button>
                </Tooltip>
                <Tooltip content="Left tooltip" placement="left">
                    <button style="padding: 8px 16px;">Left</button>
                </Tooltip>
                <Tooltip content="Right tooltip" placement="right">
                    <button style="padding: 8px 16px;">Right</button>
                </Tooltip>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};
