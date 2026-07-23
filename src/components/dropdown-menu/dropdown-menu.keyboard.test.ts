import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { keydown, mountDom, queryDom } from '../../../tests/utils/vue';
import {
    items,
    mouseenter,
    nestedItems,
    waitForDropdownClose,
} from '../../../tests/fixtures/dropdown-menu';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuItem, DropdownMenuItemSlotProps, DropdownMenuSlotProps } from './types';

describe('DropdownMenu keyboard navigation', () => {
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

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        keydown(trigger, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toMatch(/-item-0$/);

        keydown(menu, 'ArrowDown');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toMatch(/-item-2$/);

        keydown(menu, 'Enter');
        await waitForDropdownClose();

        expect(onSelect).toHaveBeenCalledWith(items[2], expect.any(CustomEvent));
        expect(queryDom(container, '[role="menu"]')).toBeNull();
    });

    it('typeaheads within the active menu, cycles matches, and skips disabled items', async () => {
        const onSelect = vi.fn();
        const typeaheadItems: DropdownMenuItem[] = [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Apple', value: 'apple' },
            { label: 'Apricot', value: 'apricot', disabled: true },
            { label: 'Beta', value: 'beta' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'typeahead-menu', items: typeaheadItems, onSelect },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();
        const menu = queryDom(container, '[role="menu"]') as HTMLElement;

        keydown(menu, 'a');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('typeahead-menu-item-1');

        keydown(menu, 'a');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('typeahead-menu-item-0');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('cycles typeahead matches with duplicate values', async () => {
        const typeaheadItems: DropdownMenuItem[] = [
            { label: 'Alpha', value: 'shared' },
            { label: 'Apple', value: 'shared' },
            { label: 'Apricot', value: 'other' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'duplicate-value-typeahead', items: typeaheadItems },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();
        const menu = queryDom(container, '[role="menu"]') as HTMLElement;

        keydown(menu, 'a');
        keydown(menu, 'a');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('duplicate-value-typeahead-item-2');

        keydown(menu, 'a');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('duplicate-value-typeahead-item-0');
    });

    it('resets typeahead when the menu closes', async () => {
        const typeaheadItems: DropdownMenuItem[] = [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Beta', value: 'beta' },
            { label: 'Bravo', value: 'bravo' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'reset-typeahead-menu', items: typeaheadItems },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        keydown(trigger, 'ArrowDown');
        await nextTick();
        let menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'b');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('reset-typeahead-menu-item-1');

        keydown(menu, 'Escape');
        await waitForDropdownClose();
        keydown(trigger, 'ArrowDown');
        await nextTick();
        menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'b');
        await nextTick();

        expect(menu.getAttribute('aria-activedescendant')).toBe('reset-typeahead-menu-item-1');
    });

    it('scopes typeahead to the currently active submenu', async () => {
        const onSelect = vi.fn();
        const typeaheadItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [
                    { label: 'Backlog', value: 'backlog' },
                    { label: 'Beta', value: 'beta', disabled: true },
                    { label: 'Bravo', value: 'bravo' },
                ],
            },
            { label: 'Billing', value: 'billing' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'scoped-typeahead-menu', items: typeaheadItems, onSelect },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();
        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'ArrowRight');
        await nextTick();
        keydown(menu, 'b');
        await nextTick();

        expect(menu.getAttribute('aria-activedescendant')).toBe('scoped-typeahead-menu-item-0-2');
        expect(onSelect).not.toHaveBeenCalled();
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

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();

        expect(queryDom(container, '.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');

        keydown(menu, 'ArrowLeft');
        await nextTick();

        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('disabled-children-menu-item-0');
    });

    it('closes an all-disabled submenu when typeahead moves to a root sibling', async () => {
        const typeaheadItems: DropdownMenuItem[] = [
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
                            id: 'disabled-submenu-typeahead',
                            items: typeaheadItems,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).not.toBeNull();

        keydown(menu, 'a');
        await nextTick();

        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe(
            'disabled-submenu-typeahead-item-1',
        );
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

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'ArrowDown');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('end-menu-item-1');

        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();

        keydown(menu, 'ArrowLeft');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('end-menu-item-1-0');

        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
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

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        keydown(trigger, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();

        const submenu = queryDom(container, '.rp-dropdown-menu__submenu') as HTMLElement;
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0-0');
        expect(submenu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0-0');

        keydown(menu, 'ArrowLeft');
        await nextTick();

        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('keyboard-menu-item-0');

        keydown(menu, 'ArrowRight');
        await nextTick();
        keydown(menu, 'ArrowDown');
        await nextTick();
        keydown(menu, 'Enter');
        await waitForDropdownClose();

        expect(onSelect).toHaveBeenCalledWith(
            keyboardItems[0].children![1],
            expect.any(CustomEvent),
        );
        expect(queryDom(container, '[role="menu"]')).toBeNull();
    });

    it('closes a hover-opened submenu without closing the root menu', async () => {
        const keyboardItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [{ label: 'Backlog', value: 'backlog' }],
            },
            { label: 'Archive', value: 'archive' },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'hover-keyboard-menu',
                            items: keyboardItems,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                        },
                    );
                },
            }),
        );

        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;
        keydown(trigger, 'ArrowDown');
        await nextTick();

        const menu = document.getElementById('hover-keyboard-menu') as HTMLElement;
        const submenuTrigger = document.getElementById(
            'hover-keyboard-menu-item-0',
        ) as HTMLButtonElement;
        expect(document.activeElement).toBe(menu);

        mouseenter(submenuTrigger, 100, 20);
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(document.activeElement).toBe(menu);

        keydown(menu, 'ArrowLeft');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(document.getElementById('hover-keyboard-menu')).toBe(menu);
        expect(menu.getAttribute('aria-activedescendant')).toBe('hover-keyboard-menu-item-0');

        mouseenter(submenuTrigger, 100, 20);
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).not.toBeNull();
        expect(document.activeElement).toBe(menu);

        keydown(menu, 'Escape');
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(document.getElementById('hover-keyboard-menu')).toBe(menu);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(menu);
    });

    it('routes ArrowDown from the parent after the public closeSubmenu control closes an active submenu', async () => {
        const moveItem: DropdownMenuItem = {
            label: 'Move to',
            value: 'move',
            children: [
                { label: 'Backlog', value: 'backlog' },
                { label: 'Done', value: 'done' },
            ],
        };
        const keyboardItems: DropdownMenuItem[] = [
            moveItem,
            { label: 'Archive', value: 'archive' },
        ];
        let moveItemSlot: DropdownMenuItemSlotProps | undefined;
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        {
                            id: 'public-close-submenu',
                            items: keyboardItems,
                        },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            item: (slotProps: DropdownMenuItemSlotProps) => {
                                if (slotProps.item === moveItem) moveItemSlot = slotProps;
                                return h('span', slotProps.item.label);
                            },
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();
        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        keydown(menu, 'ArrowRight');
        await nextTick();
        expect(menu.getAttribute('aria-activedescendant')).toBe('public-close-submenu-item-0-0');

        moveItemSlot?.closeSubmenu();
        await nextTick();
        expect(queryDom(container, '.rp-dropdown-menu__submenu')).toBeNull();
        expect(menu.getAttribute('aria-activedescendant')).toBe('public-close-submenu-item-0');

        keydown(menu, 'ArrowDown');
        await nextTick();

        expect(menu.getAttribute('aria-activedescendant')).toBe('public-close-submenu-item-1');
    });
});
