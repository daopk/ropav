import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../button/button.vue';
import DropdownMenu from './dropdown-menu.vue';
import {
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuContextTrigger,
    DropdownMenuItem,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './dropdown-menu-primitives';
import type { DropdownMenuItem as DropdownMenuDataItem } from './types';
import { getDropdownMenuSafeTriangle } from './useDropdownMenuHoverIntent';

const placements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const;
const StoryDropdownMenu = DropdownMenu as any;

type StoryPoint = {
    x: number;
    y: number;
};

const defaultItems = [
    { label: 'Rename', value: 'rename', shortcut: 'R' },
    { label: 'Duplicate', value: 'duplicate', shortcut: 'D' },
    { label: 'Archive', value: 'archive' },
    { label: 'Delete', value: 'delete', destructive: true },
];

const submenuItems: DropdownMenuDataItem[] = [
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

const safeTriangleItems: DropdownMenuDataItem[] = [
    {
        label: 'Move to',
        value: 'move',
        children: [
            { label: 'Backlog', value: 'move-backlog' },
            { label: 'In progress', value: 'move-progress' },
        ],
    },
    {
        label: 'Share with',
        value: 'share',
        children: [
            { label: 'Copy public link', value: 'share-link' },
            { label: 'Invite teammate', value: 'share-teammate' },
            { label: 'Send to reviewers', value: 'share-reviewers' },
            { label: 'Publish to workspace', value: 'share-workspace' },
            { label: 'Manage access', value: 'share-access' },
        ],
    },
    {
        label: 'Change status',
        value: 'status',
        children: [
            { label: 'Draft', value: 'status-draft' },
            { label: 'Needs review', value: 'status-review' },
            { label: 'Approved', value: 'status-approved' },
            { label: 'Blocked', value: 'status-blocked' },
            { label: 'Archived', value: 'status-archived' },
        ],
    },
    {
        label: 'Export as',
        value: 'export',
        children: [
            { label: 'PDF', value: 'export-pdf' },
            { label: 'CSV', value: 'export-csv' },
            { label: 'Markdown', value: 'export-markdown' },
        ],
    },
    {
        label: 'Copy to',
        value: 'copy',
        children: [
            { label: 'Personal folder', value: 'copy-personal' },
            { label: 'Team folder', value: 'copy-team' },
            { label: 'Archive folder', value: 'copy-archive' },
            { label: 'Shared drive', value: 'copy-shared' },
        ],
    },
    { label: 'Delete', value: 'delete', destructive: true },
];

function getSafeTriangleStoryPoints(
    stage: HTMLElement,
    item: HTMLElement,
    submenu: HTMLElement,
    origin: StoryPoint,
) {
    const stageRect = stage.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const submenuRect = submenu.getBoundingClientRect();
    const points = getDropdownMenuSafeTriangle({
        itemRect,
        submenuRect,
        origin,
    });

    return points
        .map((point) => `${point.x - stageRect.left},${point.y - stageRect.top}`)
        .join(' ');
}

function isStoryPointInElement(point: StoryPoint, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
    );
}

function isStoryEventInsideDropdownMenu(event: MouseEvent) {
    return event.target instanceof Element && Boolean(event.target.closest('.rp-dropdown-menu'));
}

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
        components: { Button, DropdownMenu: StoryDropdownMenu },
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
        components: { Button, DropdownMenu: StoryDropdownMenu },
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
        components: { Button, DropdownMenu: StoryDropdownMenu },
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
                            style="color: var(--rp-color-red-light-color); font-size: var(--rp-font-size-sm);"
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
        components: { Button, DropdownMenu: StoryDropdownMenu },
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

export const SafeTriangle: Story = {
    args: {
        items: safeTriangleItems,
    },
    render: (args) => ({
        components: { Button, DropdownMenu: StoryDropdownMenu },
        setup: () => {
            const stageRef = ref<HTMLElement | null>(null);
            const trianglePoints = ref('');
            let triangleOrigin: StoryPoint | null = null;
            let triangleSubmenuId = '';

            function hideTriangle() {
                triangleOrigin = null;
                triangleSubmenuId = '';
                trianglePoints.value = '';
            }

            function updateTriangle(event: MouseEvent) {
                if (!isStoryEventInsideDropdownMenu(event)) {
                    hideTriangle();
                    return;
                }

                const stage = stageRef.value;
                const item = stage?.querySelector<HTMLElement>('.rp-dropdown-menu__item--open');
                const submenu = stage?.querySelector<HTMLElement>('.rp-dropdown-menu__submenu');
                const point = {
                    x: event.clientX,
                    y: event.clientY,
                };

                if (!stage || !item || !submenu) {
                    hideTriangle();
                    return;
                }

                if (!triangleOrigin || triangleSubmenuId !== submenu.id) {
                    if (!isStoryPointInElement(point, item)) {
                        trianglePoints.value = '';
                        return;
                    }

                    triangleSubmenuId = submenu.id;
                    triangleOrigin = point;
                } else if (isStoryPointInElement(point, item)) {
                    triangleOrigin = point;
                }

                trianglePoints.value = getSafeTriangleStoryPoints(
                    stage,
                    item,
                    submenu,
                    triangleOrigin,
                );
            }

            return {
                args,
                hideTriangle,
                safeTriangleItems,
                stageRef,
                trianglePoints,
                updateTriangle,
            };
        },
        template: `
            <div
                ref="stageRef"
                style="box-sizing: border-box; position: relative; display: grid; min-height: 460px; place-items: center; overflow: visible; padding: 112px;"
                @mousemove="updateTriangle"
                @mouseleave="hideTriangle"
            >
                <svg
                    v-if="trianglePoints"
                    aria-hidden="true"
                    style="position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; overflow: visible; pointer-events: none;"
                >
                    <polygon
                        :points="trianglePoints"
                        fill="rgba(14, 165, 233, 0.18)"
                        stroke="rgb(14, 165, 233)"
                        stroke-width="1.5"
                    />
                </svg>
                <DropdownMenu
                    v-bind="args"
                    :items="safeTriangleItems"
                    :open="true"
                    aria-label="Project actions"
                    style="position: relative; z-index: 2;"
                >
                    <template #default="{ triggerProps }">
                        <Button v-bind="triggerProps" variant="outline">Actions</Button>
                    </template>
                </DropdownMenu>
            </div>
        `,
    }),
};

export const CompoundPrimitives: Story = {
    render: () => ({
        components: {
            DropdownMenuCheckboxItem,
            DropdownMenuContent,
            DropdownMenuItem,
            DropdownMenuItemIndicator,
            DropdownMenuLabel,
            DropdownMenuPortal,
            DropdownMenuRadioGroup,
            DropdownMenuRadioItem,
            DropdownMenuRoot,
            DropdownMenuSeparator,
            DropdownMenuSub,
            DropdownMenuSubContent,
            DropdownMenuSubTrigger,
            DropdownMenuTrigger,
        },
        setup() {
            const notifications = ref(true);
            const density = ref('comfortable');
            return { density, notifications };
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 96px;">
                <DropdownMenuRoot>
                    <DropdownMenuTrigger class="rp-button rp-button--variant-outline">Preferences</DropdownMenuTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent aria-label="Preferences">
                            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem v-model="notifications">
                                <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
                                Notifications
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup v-model="density" aria-label="Density">
                                <DropdownMenuRadioItem value="compact">
                                    <DropdownMenuItemIndicator>●</DropdownMenuItemIndicator>
                                    Compact
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="comfortable">
                                    <DropdownMenuItemIndicator>●</DropdownMenuItemIndicator>
                                    Comfortable
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Move to…</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent aria-label="Move to">
                                    <DropdownMenuItem>Backlog</DropdownMenuItem>
                                    <DropdownMenuItem>Done</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
            </div>
        `,
    }),
};

export const ContextMenu: Story = {
    render: () => ({
        components: {
            DropdownMenuContent,
            DropdownMenuContextTrigger,
            DropdownMenuItem,
            DropdownMenuPortal,
            DropdownMenuRoot,
        },
        template: `
            <div style="box-sizing: border-box; display: grid; min-height: 420px; place-items: center; padding: 96px;">
                <DropdownMenuRoot :modal="false">
                    <DropdownMenuContextTrigger
                        tabindex="0"
                        style="display: grid; min-width: 280px; min-height: 160px; place-items: center; border: 1px dashed var(--rp-color-default-border); border-radius: var(--rp-radius-md);"
                    >
                        Right-click or long-press
                    </DropdownMenuContextTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuContent aria-label="Context actions">
                            <DropdownMenuItem>Cut</DropdownMenuItem>
                            <DropdownMenuItem>Copy</DropdownMenuItem>
                            <DropdownMenuItem>Paste</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenuPortal>
                </DropdownMenuRoot>
            </div>
        `,
    }),
};
