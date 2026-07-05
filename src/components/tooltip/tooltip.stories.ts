import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Tooltip from './tooltip.vue';

const meta = {
    title: 'Components/Tooltip',
    component: Tooltip as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
        },
        delay: { control: 'number' },
        disabled: { control: 'boolean' },
    },
    args: {
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
                    <template #content>Tooltip text</template>
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
                <Tooltip placement="top">
                    <button style="padding: 8px 16px;">Top</button>
                    <template #content>Top tooltip</template>
                </Tooltip>
                <Tooltip placement="bottom">
                    <button style="padding: 8px 16px;">Bottom</button>
                    <template #content>Bottom tooltip</template>
                </Tooltip>
                <Tooltip placement="left">
                    <button style="padding: 8px 16px;">Left</button>
                    <template #content>Left tooltip</template>
                </Tooltip>
                <Tooltip placement="right">
                    <button style="padding: 8px 16px;">Right</button>
                    <template #content>Right tooltip</template>
                </Tooltip>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: { disabled: true },
};
