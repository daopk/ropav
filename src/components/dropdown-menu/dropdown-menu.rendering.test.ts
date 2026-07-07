import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { click, mountDom } from '../../../tests/utils/vue';
import { items, waitDropdownTransition } from '../../../tests/fixtures/dropdown-menu';
import DropdownMenu from './dropdown-menu.vue';
import type {
    DropdownMenuItemSlotProps,
    DropdownMenuPlacement,
    DropdownMenuSlotProps,
} from './types';

describe('DropdownMenu rendering', () => {
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
