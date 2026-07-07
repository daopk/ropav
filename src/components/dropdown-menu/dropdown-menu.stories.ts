import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../button/button.vue';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuItem } from './types';

const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const;

const defaultItems = [
    { label: 'Rename', value: 'rename', shortcut: 'R' },
    { label: 'Duplicate', value: 'duplicate', shortcut: 'D' },
    { label: 'Archive', value: 'archive' },
    { label: 'Delete', value: 'delete', destructive: true },
];

const submenuItems: DropdownMenuItem[] = [
    { label: 'Rename', value: 'rename', shortcut: 'R' },
    {
        label: 'Move to',
        value: 'move',
        children: [
            { label: 'Backlog', value: 'move-backlog' },
            { label: 'In progress', value: 'move-progress' },
            {
                label: 'Archive',
                value: 'move-archive',
                children: [
                    { label: 'This week', value: 'archive-week' },
                    { label: 'This month', value: 'archive-month' },
                ],
            },
        ],
    },
    {
        label: 'Share',
        value: 'share',
        children: [
            { label: 'Copy link', value: 'copy-link', shortcut: 'Cmd+L' },
            { label: 'Invite teammate', value: 'invite' },
        ],
    },
    { label: 'Delete', value: 'delete', destructive: true },
];

const meta = {
    title: 'Components/DropdownMenu',
    component: DropdownMenu as any,
    tags: ['autodocs'],
    argTypes: {
        placement: {
            control: 'select',
            options: placements,
        },
        open: { control: 'boolean' },
        disabled: { control: 'boolean' },
        closeOnSelect: { control: 'boolean' },
        items: { control: 'object' },
    },
    args: {
        placement: 'bottom-start',
        disabled: false,
        closeOnSelect: true,
        items: defaultItems,
    },
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: (args) => ({
        components: { Button, DropdownMenu },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <DropdownMenu v-bind="args" aria-label="Project actions">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Actions</Button>
                    </template>
                </DropdownMenu>
            </div>
        `,
    }),
};

export const Placements: Story = {
    render: (args) => ({
        components: { Button, DropdownMenu },
        setup: () => ({ args, placements }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 760px; place-items: center; padding: 96px 112px;">
                <div style="display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); width: min(760px, 100%); gap: 112px 160px;">
                    <div
                        v-for="placement in placements"
                        :key="placement"
                        :style="{
                            display: 'grid',
                            minHeight: '280px',
                            alignItems: placement.startsWith('top') ? 'end' : 'start',
                            justifyItems: placement.endsWith('end') ? 'end' : 'start',
                        }"
                    >
                        <DropdownMenu
                            v-bind="args"
                            :placement="placement"
                            open
                        >
                            <template #default="{ triggerProps }">
                                <Button v-bind="triggerProps" variant="outline">{{ placement }}</Button>
                            </template>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        `,
    }),
};

export const CustomItem: Story = {
    render: (args) => ({
        components: { Button, DropdownMenu },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 360px; place-items: center; padding: 96px;">
                <DropdownMenu v-bind="args">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="surface">Manage</Button>
                    </template>
                    <template #item="{ item }">
                        <span style="flex: 1;">{{ item.label }}</span>
                        <span
                            v-if="item.destructive"
                            style="color: var(--rp-color-danger-fg); font-size: var(--rp-font-size-sm);"
                        >
                            Soon
                        </span>
                    </template>
                </DropdownMenu>
            </div>
        `,
    }),
};

export const Submenus: Story = {
    args: {
        items: submenuItems,
    },
    render: (args) => ({
        components: { Button, DropdownMenu },
        setup: () => ({ args }),
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 460px; place-items: center; padding: 112px;">
                <DropdownMenu v-bind="args" aria-label="Project actions">
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Actions</Button>
                    </template>
                </DropdownMenu>
            </div>
        `,
    }),
};
