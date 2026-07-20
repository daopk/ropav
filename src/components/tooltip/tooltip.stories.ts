import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import Button from '../button/button.vue';
import Tooltip from './tooltip.vue';

const placements = ['top', 'right', 'bottom', 'left'] as const;
const colors = ['blue', 'violet', 'green', 'orange', 'red', 'cyan', 'gray'] as const;

const meta = {
    title: 'Components/Tooltip',
    component: Tooltip as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: placements,
        },
        color: {
            control: 'text',
        },
        autoContrast: { control: 'boolean' },
        content: { control: 'text' },
        open: { control: 'boolean' },
        openDelay: { control: 'number' },
        arrow: { control: 'boolean' },
        disabled: { control: 'boolean' },
        decorative: { control: 'boolean' },
        offset: { control: 'object' },
        flipOptions: { control: 'object' },
        autoUpdateOptions: { control: 'object' },
        target: { control: false },
    },
    args: {
        autoContrast: true,
        arrow: false,
        content: 'Create a new project',
        decorative: false,
        disabled: false,
        placement: 'top',
        openDelay: 300,
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

export const TeleportedStyles: Story = {
    tags: ['test'],
    args: {
        id: 'teleported-tooltip-styles',
        open: true,
        arrow: true,
    },
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Tooltip v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps">Inspect styles</Button>
                    </template>
                </Tooltip>
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const storyDocument = canvasElement.ownerDocument;
        const content = storyDocument.querySelector<HTMLElement>('#teleported-tooltip-styles')!;
        const arrow = content.querySelector<HTMLElement>('.rp-tooltip__arrow')!;

        await waitFor(() => {
            expect(content).toBeVisible();
            expect(content.style.visibility).not.toBe('hidden');
        });

        const contentStyle = getComputedStyle(content);
        const arrowRect = arrow.getBoundingClientRect();

        expect(contentStyle.getPropertyValue('--_rp-tooltip-bg').trim()).not.toBe('');
        expect(contentStyle.getPropertyValue('--_rp-tooltip-fg').trim()).not.toBe('');
        expect(contentStyle.getPropertyValue('--_rp-tooltip-arrow-size').trim()).not.toBe('');
        expect(contentStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(arrowRect.width).toBeGreaterThan(0);
        expect(arrowRect.height).toBeGreaterThan(0);
    },
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

export const Colors: Story = {
    args: {
        open: true,
    },
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args, colors }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 96px;">
                <div style="display: flex; flex-wrap: wrap; gap: 48px 56px; justify-content: center; max-width: 720px;">
                    <Tooltip
                        v-for="color in colors"
                        :key="color"
                        v-bind="args"
                        :color="color"
                        :content="color + ' tooltip'"
                        :open-delay="0"
                        arrow
                    >
                        <template #default="{ triggerProps }">
                            <Button v-bind="triggerProps" variant="outline" :color="color">
                                {{ color }}
                            </Button>
                        </template>
                    </Tooltip>
                </div>
            </div>
        `,
    }),
};

export const CustomColor: Story = {
    args: {
        color: '#ff3366',
        content: 'Custom color tooltip',
        open: true,
    },
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Tooltip v-bind="args" :open-delay="0" arrow>
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline" color="#ff3366">
                            Custom color
                        </Button>
                    </template>
                </Tooltip>
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
                            <span style="width: 8px; height: 8px; border-radius: 999px; background: var(--rp-color-green-filled);"></span>
                            All checks passed
                        </span>
                    </template>
                </Tooltip>
            </div>
        `,
    }),
};

export const Offset: Story = {
    args: {
        placement: 'bottom',
        offset: {
            mainAxis: 24,
            crossAxis: 16,
        },
        open: true,
    },
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Tooltip v-bind="args" content="Offset on both axes" :open-delay="0" arrow>
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Offset</Button>
                    </template>
                </Tooltip>
            </div>
        `,
    }),
};

export const Target: Story = {
    tags: ['test'],
    args: {
        open: true,
        teleport: false,
    },
    render: (args) => ({
        components: { Button, Tooltip },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <Button id="tooltip-target-button" variant="outline">External target</Button>
                <Tooltip
                    v-bind="args"
                    target="#tooltip-target-button"
                    content="Tooltip attached by selector"
                    :open-delay="0"
                />
            </div>
        `,
    }),
    play: async ({ canvasElement }) => {
        const content = canvasElement.querySelector<HTMLElement>('[role="tooltip"]')!;

        await waitFor(() => {
            expect(content).toBeVisible();
            expect(content.style.visibility).not.toBe('hidden');
        });

        expect(getComputedStyle(content).translate).toBe('none');
    },
};
