import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { click, keydown, mountDom, queryDom, queryDomAll } from '../../../tests/utils/vue';
import {
    createRect,
    mouseenter,
    mousemove,
    nestedItems,
    waitForDropdownClose,
} from '../../../tests/fixtures/dropdown-menu';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuItem, DropdownMenuSlotProps } from './types';
import { getDropdownMenuSafeTriangle } from './useDropdownMenuHoverIntent';

describe('DropdownMenu submenus', () => {
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const moveTrigger = [...queryDomAll(container, '[role="menuitem"]')].find((item) =>
            item.textContent?.includes('Move to'),
        ) as HTMLButtonElement;

        expect(moveTrigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(moveTrigger.getAttribute('aria-expanded')).toBe('false');

        click(moveTrigger);
        await nextTick();

        const submenu = queryDom(container, '.rp-dropdown-menu__submenu') as HTMLElement;
        const progressItem = [...submenu.querySelectorAll('[role="menuitem"]')].find((item) =>
            item.textContent?.includes('In progress'),
        ) as HTMLButtonElement;

        expect(moveTrigger.getAttribute('aria-expanded')).toBe('true');
        expect(moveTrigger.getAttribute('aria-controls')).toBe('nested-menu-submenu-1');
        expect(submenu.getAttribute('role')).toBe('menu');
        expect(submenu.getAttribute('aria-label')).toBe('Move to');

        click(progressItem);
        await waitForDropdownClose();

        expect(onSelect).toHaveBeenCalledWith(nestedItems[1].children![1], expect.any(CustomEvent));
        expect(queryDom(container, '[role="menu"]')).toBeNull();
    });

    it('keeps an ancestor submenu open and active when hovering its leaf', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'leaf-hover-menu',
                            items: [
                                {
                                    label: 'Move to',
                                    value: 'move',
                                    children: [{ label: 'Backlog', value: 'move-backlog' }],
                                },
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const moveTrigger = document.getElementById('leaf-hover-menu-item-0') as HTMLButtonElement;
        mouseenter(moveTrigger, 100, 20);
        await nextTick();

        const backlogItem = document.getElementById(
            'leaf-hover-menu-item-0-0',
        ) as HTMLButtonElement;
        mouseenter(backlogItem, 200, 20);
        await nextTick();

        const submenu = document.getElementById('leaf-hover-menu-submenu-0');
        expect(submenu).not.toBeNull();
        expect(moveTrigger.getAttribute('aria-expanded')).toBe('true');
        expect(submenu?.getAttribute('aria-activedescendant')).toBe('leaf-hover-menu-item-0-0');
        expect(backlogItem.hasAttribute('data-highlighted')).toBe(true);
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
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
        await waitForDropdownClose();

        expect(onSelect).toHaveBeenCalledWith(
            deepNestedItems[0].children![1]!.children![0],
            expect.any(CustomEvent),
        );
        expect(queryDom(container, '[role="menu"]')).toBeNull();
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
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

    it('consumes a pending safe-triangle hover after committing it', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'pending-hover-menu',
                            items: [
                                {
                                    label: 'Move to',
                                    value: 'move',
                                    children: [{ label: 'Backlog', value: 'move-backlog' }],
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        const moveTrigger = document.getElementById(
            'pending-hover-menu-item-0',
        ) as HTMLButtonElement;
        const archiveItem = document.getElementById(
            'pending-hover-menu-item-1',
        ) as HTMLButtonElement;
        moveTrigger.getBoundingClientRect = vi.fn(() => createRect(0, 0, 180, 40));
        archiveItem.scrollIntoView = vi.fn();

        mouseenter(moveTrigger, 170, 20);
        await nextTick();

        const submenu = document.getElementById('pending-hover-menu-submenu-0') as HTMLElement;
        submenu.getBoundingClientRect = vi.fn(() => createRect(188, 0, 368, 120));

        mouseenter(archiveItem, 180, 50);
        mousemove(menu, 20, 70);
        await nextTick();

        expect(archiveItem.scrollIntoView).toHaveBeenCalledTimes(1);

        mousemove(menu, 30, 70);
        await nextTick();

        expect(archiveItem.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('cancels a pending safe-triangle hover when keyboard navigation takes over', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'keyboard-cancels-hover-menu',
                            items: [
                                {
                                    label: 'Move to',
                                    value: 'move',
                                    children: [{ label: 'Backlog', value: 'move-backlog' }],
                                },
                                { label: 'Archive', value: 'archive' },
                                { label: 'Delete', value: 'delete' },
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        const moveTrigger = document.getElementById(
            'keyboard-cancels-hover-menu-item-0',
        ) as HTMLButtonElement;
        const archiveItem = document.getElementById(
            'keyboard-cancels-hover-menu-item-1',
        ) as HTMLButtonElement;
        const deleteItem = document.getElementById(
            'keyboard-cancels-hover-menu-item-2',
        ) as HTMLButtonElement;
        moveTrigger.getBoundingClientRect = vi.fn(() => createRect(0, 0, 180, 40));

        mouseenter(moveTrigger, 170, 20);
        await nextTick();

        const submenu = document.getElementById(
            'keyboard-cancels-hover-menu-submenu-0',
        ) as HTMLElement;
        submenu.getBoundingClientRect = vi.fn(() => createRect(188, 0, 368, 120));

        mouseenter(archiveItem, 180, 50);
        keydown(menu, 'End');
        await nextTick();

        expect(document.getElementById('keyboard-cancels-hover-menu-submenu-0')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe(
            'keyboard-cancels-hover-menu-item-2',
        );
        expect(deleteItem.hasAttribute('data-highlighted')).toBe(true);

        mousemove(menu, 20, 70);
        await nextTick();

        expect(menu.getAttribute('aria-activedescendant')).toBe(
            'keyboard-cancels-hover-menu-item-2',
        );
        expect(deleteItem.hasAttribute('data-highlighted')).toBe(true);
        expect(archiveItem.hasAttribute('data-highlighted')).toBe(false);
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
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
});
