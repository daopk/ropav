import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { keydown, mountDom } from '../../../tests/utils/vue';
import { items, nestedItems, waitDropdownTransition } from '../../../tests/fixtures/dropdown-menu';
import DropdownMenu from './dropdown-menu.vue';
import type { DropdownMenuItem, DropdownMenuSlotProps } from './types';

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
});
