import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../button/button.vue';
import Tooltip from './tooltip.vue';

const placements = ['top', 'right', 'bottom', 'left'] as const;

const meta = {
    title: 'Components/Tooltip',
    component: Tooltip as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: placements,
        },
        content: { control: 'text' },
        open: { control: 'boolean' },
        openDelay: { control: 'number' },
        arrow: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
    args: {
        content: 'Create a new project',
        placement: 'top',
        openDelay: 300,
        arrow: false,
        disabled: false,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Tooltip v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps">Create</Button>
                    </template>
                </Tooltip>
            </div>
        `,
    }),
};

export const Placements: Story = {
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args, placements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 96px;">
                <div style="display: grid; grid-template-columns: repeat(2, max-content); gap: 64px 96px;">
                    <Tooltip
                        v-for="placement in placements"
                        :key="placement"
                        v-bind="args"
                        :placement="placement"
                        :content="'Tooltip on ' + placement"
                        :open-delay="0"
                    >
                        <template #default="{ triggerProps }">
                            <Button v-bind="triggerProps" variant="outline">{{ placement }}</Button>
                        </template>
                    </Tooltip>
                </div>
            </div>
        `,
    }),
};

export const CustomContent: Story = {
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Tooltip v-bind="args" placement="right" :open-delay="0">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="surface">Status</Button>
                    </template>
                    <template #content>
                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; border-radius: 999px; background: var(--rp-color-success);"></span>
                            All checks passed
                        </span>
                    </template>
                </Tooltip>
            </div>
        `,
    }),
};
