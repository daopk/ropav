import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../button/button.vue';
import Popover from './popover.vue';

const placements = ['top', 'right', 'bottom', 'left'] as const;
const roles = ['dialog', 'menu', 'listbox', 'tree', 'grid'] as const;

const meta = {
    title: 'Components/Popover',
    component: Popover as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: placements,
        },
        role: {
            control: 'select',
            options: roles,
        },
        open: { control: 'boolean' },
        disabled: { control: 'boolean' },
        offset: { control: 'object' },
        closeOnOutsideClick: { control: 'boolean' },
        closeOnEscape: { control: 'boolean' },
        target: { control: false },
    },
    args: {
        placement: 'bottom',
        role: 'dialog',
        disabled: false,
        closeOnOutsideClick: true,
        closeOnEscape: true,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Popover v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Project status</Button>
                    </template>
                    <template #content="{ close }">
                        <div style="display: grid; gap: 12px; width: 220px;">
                            <div style="display: grid; gap: 4px;">
                                <strong>Project status</strong>
                                <span style="color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm);">
                                    Review is complete and ready for release.
                                </span>
                            </div>
                            <Button size="sm" @click="close">Done</Button>
                        </div>
                    </template>
                </Popover>
            </div>
        `,
    }),
};

export const Placements: Story = {
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args, placements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 96px;">
                <div style="display: grid; grid-template-columns: repeat(2, max-content); gap: 72px 112px;">
                    <Popover
                        v-for="placement in placements"
                        :key="placement"
                        v-bind="args"
                        :placement="placement"
                    >
                        <template #default="{ triggerProps }">
                            <Button v-bind="triggerProps" variant="outline">{{ placement }}</Button>
                        </template>
                        <template #content>
                            <div style="width: 180px;">
                                Popover on {{ placement }}
                            </div>
                        </template>
                    </Popover>
                </div>
            </div>
        `,
    }),
};

export const Offset: Story = {
    args: {
        placement: 'right',
        offset: {
            mainAxis: 24,
            crossAxis: 16,
        },
        open: true,
    },
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Popover v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Offset</Button>
                    </template>
                    <template #content>
                        <div style="width: 180px;">Aligned with custom axis offsets.</div>
                    </template>
                </Popover>
            </div>
        `,
    }),
};

export const Target: Story = {
    render: (args) => ({
        components: { Button, Popover },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Button id="popover-target-button" variant="outline">External target</Button>
                <Popover v-bind="args" target="#popover-target-button">
                    <div style="display: grid; gap: 8px; width: 220px;">
                        <strong>External target</strong>
                        <span style="color: var(--rp-color-text-secondary); font-size: var(--rp-font-size-sm);">
                            This panel is anchored by selector.
                        </span>
                    </div>
                </Popover>
            </div>
        `,
    }),
};
