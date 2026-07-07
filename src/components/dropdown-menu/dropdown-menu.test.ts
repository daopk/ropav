import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { click, keydown, mountDom, waitTransition } from '../../../tests/utils/vue';
import DropdownMenu from './dropdown-menu.vue';
import type {
    DropdownMenuItem,
    DropdownMenuItemSlotProps,
    DropdownMenuPlacement,
    DropdownMenuSlotProps,
} from './types';
import { getDropdownMenuSafeTriangle } from './useDropdownMenuHoverIntent';

async function waitDropdownTransition() {
    await waitTransition();
    await waitTransition();
    await waitTransition();
}

function createRect(left: number, top: number, right: number, bottom: number): DOMRect {
    return {
        bottom,
        height: bottom - top,
        left,
        right,
        top,
        width: right - left,
        x: left,
        y: top,
        toJSON: () => ({}),
    } as DOMRect;
}

function mouseenter(el: Element, clientX: number, clientY: number) {
    el.dispatchEvent(
        new MouseEvent('mouseenter', {
            bubbles: false,
            cancelable: true,
            clientX,
            clientY,
        }),
    );
}

function mousemove(el: Element, clientX: number, clientY: number) {
    el.dispatchEvent(
        new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
        }),
    );
}

describe('DropdownMenu', () => {
    const items: DropdownMenuItem[] = [
        { label: 'Rename', value: 'rename', shortcut: 'R' },
        { label: 'Duplicate', value: 'duplicate', disabled: true },
        { label: 'Archive', value: 'archive' },
        { label: 'Delete', value: 'delete', destructive: true },
    ];
    const nestedItems: DropdownMenuItem[] = [
        { label: 'Rename', value: 'rename' },
        {
            label: 'Move to',
            value: 'move',
            children: [
                { label: 'Backlog', value: 'move-backlog' },
                { label: 'In progress', value: 'move-progress' },
            ],
        },
        { label: 'Delete', value: 'delete', destructive: true },
    ];

    it('renders trigger props, opens items, selects an item, and closes', async () => {
        const onOpen = vi.fn();
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'project-menu',
                            items,
                            ariaLabel: 'Project actions',
                            'onUpdate:open': onOpen,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps, isOpen }: DropdownMenuSlotProps) =>
                                h(
                                    'button',
                                    { class: 'trigger', ...triggerProps },
                                    isOpen ? 'Close' : 'Actions',
                                ),
                        },
                    );
                },
            }),
        );

        const root = container.querySelector('.rp-dropdown-menu') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        expect([...root.classList]).toEqual([
            'rp-dropdown-menu',
            'rp-dropdown-menu--placement-bottom-start',
        ]);
        expect(trigger.getAttribute('aria-controls')).toBe('project-menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(container.querySelector('[role="menu"]')).toBeNull();

        click(trigger);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        const menuItems = [...container.querySelectorAll('[role="menuitem"]')];

        expect(root.classList.contains('rp-dropdown-menu--open')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(menu.id).toBe('project-menu');
        expect(menu.getAttribute('aria-label')).toBe('Project actions');
        expect(menuItems).toHaveLength(items.length);
        expect(menuItems[0].textContent).toContain('Rename');
        expect(menuItems[0].textContent).toContain('R');
        expect(menuItems[0].getAttribute('tabindex')).toBe('-1');
        expect(menuItems[1].getAttribute('aria-disabled')).toBe('true');
        expect(menuItems[3].classList.contains('rp-dropdown-menu__item--destructive')).toBe(true);
        expect(container.querySelector('.rp-dropdown-menu__item-wrap')?.getAttribute('role')).toBe(
            'none',
        );

        click(menuItems[0]);
        await waitDropdownTransition();

        expect(onOpen).toHaveBeenNthCalledWith(1, true);
        expect(onOpen).toHaveBeenNthCalledWith(2, false);
        expect(onSelect).toHaveBeenCalledWith(items[0]);
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('navigates the menu with the keyboard and skips disabled items', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            items,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        keydown(trigger, 'ArrowDown');
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toMatch(/-item-0$/);

        keydown(menu, 'ArrowDown');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toMatch(/-item-2$/);

        keydown(menu, 'Enter');
        await waitDropdownTransition();

        expect(onSelect).toHaveBeenCalledWith(items[2]);
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('opens submenus with pointer interaction and selects leaf items', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'nested-menu',
                            items: nestedItems,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        const moveTrigger = [...container.querySelectorAll('[role="menuitem"]')].find((item) =>
            item.textContent?.includes('Move to'),
        ) as HTMLButtonElement;

        expect(moveTrigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(moveTrigger.getAttribute('aria-expanded')).toBe('false');

        click(moveTrigger);
        await nextTick();

        const submenu = container.querySelector('.rp-dropdown-menu__submenu') as HTMLElement;
        const progressItem = [...submenu.querySelectorAll('[role="menuitem"]')].find((item) =>
            item.textContent?.includes('In progress'),
        ) as HTMLButtonElement;

        expect(moveTrigger.getAttribute('aria-expanded')).toBe('true');
        expect(moveTrigger.getAttribute('aria-controls')).toBe('nested-menu-submenu-1');
        expect(submenu.getAttribute('role')).toBe('menu');
        expect(submenu.getAttribute('aria-label')).toBe('Move to');

        click(progressItem);
        await waitDropdownTransition();

        expect(onSelect).toHaveBeenCalledWith(nestedItems[1].children![1]);
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('opens second-level submenus and lets their flyout escape the parent submenu', async () => {
        const onSelect = vi.fn();
        const deepNestedItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [
                    { label: 'Backlog', value: 'move-backlog' },
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
            { label: 'Delete', value: 'delete', destructive: true },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'deep-menu',
                            items: deepNestedItems,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        click(document.getElementById('deep-menu-item-0') as HTMLButtonElement);
        await nextTick();

        const firstSubmenu = document.getElementById('deep-menu-submenu-0') as HTMLElement;
        expect(firstSubmenu.classList.contains('rp-dropdown-menu__submenu--has-submenu')).toBe(
            true,
        );

        click(document.getElementById('deep-menu-item-0-1') as HTMLButtonElement);
        await nextTick();

        const secondSubmenu = document.getElementById('deep-menu-submenu-0-1') as HTMLElement;
        expect(secondSubmenu).not.toBeNull();
        expect(secondSubmenu.getAttribute('aria-label')).toBe('Archive');
        expect(document.getElementById('deep-menu-item-0-1')?.getAttribute('aria-expanded')).toBe(
            'true',
        );

        click(document.getElementById('deep-menu-item-0-1-0') as HTMLButtonElement);
        await waitDropdownTransition();

        expect(onSelect).toHaveBeenCalledWith(deepNestedItems[0].children![1]!.children![0]);
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('keeps submenus open while the pointer crosses the safe triangle', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'safe-menu',
                            items: [
                                {
                                    label: 'Move to',
                                    value: 'move',
                                    children: [
                                        { label: 'Backlog', value: 'move-backlog' },
                                        { label: 'Done', value: 'move-done' },
                                    ],
                                },
                                { label: 'Archive', value: 'archive' },
                            ],
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        const moveTrigger = document.getElementById('safe-menu-item-0') as HTMLButtonElement;
        const archiveItem = document.getElementById('safe-menu-item-1') as HTMLButtonElement;

        mouseenter(moveTrigger, 170, 20);
        await nextTick();

        const submenu = document.getElementById('safe-menu-submenu-0') as HTMLElement;
        moveTrigger.getBoundingClientRect = vi.fn(() => createRect(0, 0, 180, 40));
        submenu.getBoundingClientRect = vi.fn(() => createRect(188, 0, 368, 120));

        mouseenter(archiveItem, 180, 50);
        await nextTick();

        expect(document.getElementById('safe-menu-submenu-0')).not.toBeNull();
        expect(moveTrigger.getAttribute('aria-expanded')).toBe('true');
        expect(menu.getAttribute('aria-activedescendant')).toBe('safe-menu-item-0');

        mousemove(menu, 200, 60);
        await nextTick();

        expect(document.getElementById('safe-menu-submenu-0')).not.toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('safe-menu-item-0');

        mousemove(menu, 20, 70);
        await nextTick();

        expect(document.getElementById('safe-menu-submenu-0')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('safe-menu-item-1');
    });

    it('bounds the safe triangle origin to the open submenu trigger', () => {
        const triangle = getDropdownMenuSafeTriangle({
            itemRect: createRect(100, 40, 280, 80),
            submenuRect: createRect(288, 32, 468, 128),
            origin: {
                x: -120,
                y: 160,
            },
        });

        expect(triangle[0]).toEqual({
            x: 98,
            y: 80,
        });
        expect(triangle[1]).toEqual({
            x: 288,
            y: 30,
        });
        expect(triangle[2]).toEqual({
            x: 288,
            y: 130,
        });
    });

    it('updates the safe triangle origin as the pointer moves across an open trigger', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'refresh-safe-menu',
                            items: [
                                {
                                    label: 'Move to',
                                    value: 'move',
                                    children: [
                                        { label: 'Backlog', value: 'move-backlog' },
                                        { label: 'Done', value: 'move-done' },
                                    ],
                                },
                                { label: 'Archive', value: 'archive' },
                            ],
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        const moveTrigger = document.getElementById(
            'refresh-safe-menu-item-0',
        ) as HTMLButtonElement;
        const archiveItem = document.getElementById(
            'refresh-safe-menu-item-1',
        ) as HTMLButtonElement;

        moveTrigger.getBoundingClientRect = vi.fn(() => createRect(0, 0, 180, 40));
        mouseenter(moveTrigger, 10, 20);
        await nextTick();

        const submenu = document.getElementById('refresh-safe-menu-submenu-0') as HTMLElement;
        submenu.getBoundingClientRect = vi.fn(() => createRect(188, 0, 368, 120));

        mousemove(menu, 170, 20);
        await nextTick();

        mouseenter(archiveItem, 100, 70);
        await nextTick();

        expect(document.getElementById('refresh-safe-menu-submenu-0')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('refresh-safe-menu-item-1');
    });

    it('keeps focus on a submenu trigger when all child items are disabled', async () => {
        const disabledChildrenItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [
                    { label: 'Backlog', value: 'move-backlog', disabled: true },
                    { label: 'Done', value: 'move-done', disabled: true },
                ],
            },
            { label: 'Archive', value: 'archive' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'disabled-children-menu',
                            items: disabledChildrenItems,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(container.querySelector('.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();

        expect(container.querySelector('.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');

        keydown(menu, 'ArrowLeft');
        await nextTick();

        expect(container.querySelector('.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');
    });

    it('uses the visual submenu direction for horizontal keyboard navigation', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'end-menu',
                            items: nestedItems,
                            placement: 'bottom-end',
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(container.querySelector('.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        keydown(menu, 'ArrowDown');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('end-menu-item-1');

        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(container.querySelector('.rp-dropdown-menu__submenu')).toBeNull();

        keydown(menu, 'ArrowLeft');
        await nextTick();
        expect(container.querySelector('.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('end-menu-item-1-0');

        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(container.querySelector('.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('end-menu-item-1');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('navigates submenus with ArrowRight and ArrowLeft', async () => {
        const onSelect = vi.fn();
        const keyboardItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [
                    { label: 'Backlog', value: 'move-backlog' },
                    { label: 'Done', value: 'move-done' },
                ],
            },
            { label: 'Archive', value: 'archive' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'keyboard-menu',
                            items: keyboardItems,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        keydown(trigger, 'ArrowDown');
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();

        const submenu = container.querySelector('.rp-dropdown-menu__submenu') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0-0');
        expect(submenu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0-0');

        keydown(menu, 'ArrowLeft');
        await nextTick();

        expect(container.querySelector('.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();
        keydown(menu, 'ArrowDown');
        await nextTick();
        keydown(menu, 'Enter');
        await waitDropdownTransition();

        expect(onSelect).toHaveBeenCalledWith(keyboardItems[0].children![1]);
        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('keeps disabled menu closed and trigger non-interactive', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            disabled: true,
                            items,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const root = container.querySelector('.rp-dropdown-menu') as HTMLElement;
        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        keydown(trigger, 'ArrowDown');
        await nextTick();

        expect(root.classList.contains('rp-dropdown-menu--disabled')).toBe(true);
        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-controls')).toBeNull();
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes on outside click and Escape', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();
        expect(container.querySelector('[role="menu"]')).not.toBeNull();

        click(document.body);
        await waitDropdownTransition();
        expect(container.querySelector('[role="menu"]')).toBeNull();

        click(trigger);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        keydown(menu, 'Escape');
        await waitDropdownTransition();

        expect(container.querySelector('[role="menu"]')).toBeNull();
    });

    it('supports custom item rendering and opt-out close on select', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            items,
                            closeOnSelect: false,
                            onSelect,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            item: ({ item }: DropdownMenuItemSlotProps) =>
                                h('span', { class: 'custom-item' }, item.value),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        const firstItem = container.querySelector('[role="menuitem"]') as HTMLButtonElement;
        expect(firstItem.textContent).toBe('rename');

        click(firstItem);
        await nextTick();

        expect(onSelect).toHaveBeenCalledWith(items[0]);
        expect(container.querySelector('[role="menu"]')).not.toBeNull();
    });

    it('supports controlled open state through the update event', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    const open = ref(false);

                    return () =>
                        h(
                            DropdownMenu,
                            {
                                items,
                                open: open.value,
                                'onUpdate:open': (value: boolean) => {
                                    onOpen(value);
                                    open.value = value;
                                },
                            },
                            {
                                default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                    h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            },
                        );
                },
            }),
        );

        const trigger = container.querySelector('.trigger') as HTMLButtonElement;

        click(trigger);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;
        expect(menu).not.toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        keydown(menu, 'Escape');
        await waitDropdownTransition();

        expect(onOpen).toHaveBeenNthCalledWith(1, true);
        expect(onOpen).toHaveBeenNthCalledWith(2, false);
        expect(container.querySelector('[role="menu"]')).toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('renders an empty state when no items are available', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items: [] },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            empty: () => h('span', { class: 'empty-slot' }, 'Nothing here'),
                        },
                    );
                },
            }),
        );

        click(container.querySelector('.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = container.querySelector('[role="menu"]') as HTMLElement;

        expect(menu.getAttribute('aria-activedescendant')).toBeNull();
        expect(container.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
        expect(container.querySelector('.empty-slot')?.textContent).toBe('Nothing here');
    });

    it('adds a placement modifier for each supported placement', () => {
        const placements: DropdownMenuPlacement[] = [
            'bottom-start',
            'bottom-end',
            'top-start',
            'top-end',
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        placements.map((placement) =>
                            h(
                                DropdownMenu,
                                { items, placement },
                                {
                                    default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                        h('button', triggerProps, placement),
                                },
                            ),
                        ),
                    );
                },
            }),
        );

        const roots = [...container.querySelectorAll('.rp-dropdown-menu')];

        expect(roots).toHaveLength(placements.length);
        for (const [index, placement] of placements.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-dropdown-menu',
                `rp-dropdown-menu--placement-${placement}`,
            ]);
        }
    });
});
