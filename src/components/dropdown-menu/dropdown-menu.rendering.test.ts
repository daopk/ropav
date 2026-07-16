import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { click, keydown, mountDom, queryDom, queryDomAll } from '../../../tests/utils/vue';
import { items, waitDropdownTransition } from '../../../tests/fixtures/dropdown-menu';
import type { FloatingReference } from '../floating/types';
import DropdownMenu from './dropdown-menu.vue';
import DropdownMenuPortal from './dropdown-menu-portal.vue';
import type {
    DropdownMenuItem,
    DropdownMenuItemSlotProps,
    DropdownMenuPlacement,
    DropdownMenuSlotProps,
} from './types';

describe('DropdownMenu rendering', () => {
    it('rebinds positioning when an ancestor portal moves the reference', async () => {
        const portalDisabled = ref(false);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        { class: 'dropdown-scroll-host', style: { overflow: 'auto' } },
                        h(
                            DropdownMenuPortal,
                            { disabled: portalDisabled.value },
                            {
                                default: () =>
                                    h(
                                        DropdownMenu,
                                        {
                                            id: 'ancestor-move-menu',
                                            items: [{ label: 'Rename', value: 'rename' }],
                                            open: true,
                                            flip: false,
                                            shift: false,
                                        },
                                        {
                                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                                h('button', triggerProps, 'Actions'),
                                        },
                                    ),
                            },
                        ),
                    );
                },
            }),
        );

        await nextTick();
        await nextTick();
        const host = container.querySelector('.dropdown-scroll-host') as HTMLElement;
        const root = document.body.querySelector('.rp-dropdown-menu') as HTMLElement;
        const addHostListener = vi.spyOn(host, 'addEventListener');
        const getReferenceRect = vi.spyOn(root, 'getBoundingClientRect');

        portalDisabled.value = true;
        await nextTick();
        await nextTick();
        await vi.waitFor(() => expect(getReferenceRect).toHaveBeenCalled());

        expect(host.contains(root)).toBe(true);
        expect(addHostListener).toHaveBeenCalledWith('scroll', expect.any(Function));

        getReferenceRect.mockClear();
        host.dispatchEvent(new Event('scroll'));
        await vi.waitFor(() => expect(getReferenceRect).toHaveBeenCalled());
    });

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

        const root = queryDom(container, '.rp-dropdown-menu') as HTMLElement;
        const trigger = queryDom(container, '.trigger') as HTMLButtonElement;

        expect([...root.classList]).toEqual([
            'rp-dropdown-menu',
            'rp-dropdown-menu--placement-bottom-start',
        ]);
        expect(trigger.getAttribute('aria-controls')).toBe('project-menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(queryDom(container, '[role="menu"]')).toBeNull();

        click(trigger);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        const menuItems = [...queryDomAll(container, '[role="menuitem"]')];

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
        expect(queryDom(container, '.rp-dropdown-menu__item-wrap')?.getAttribute('role')).toBe(
            'none',
        );

        click(menuItems[0]);
        await waitDropdownTransition();

        expect(onOpen).toHaveBeenNthCalledWith(1, true);
        expect(onOpen).toHaveBeenNthCalledWith(2, false);
        expect(onSelect).toHaveBeenCalledWith(items[0], expect.any(CustomEvent));
        expect(queryDom(container, '[role="menu"]')).toBeNull();
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const firstItem = queryDom(container, '[role="menuitem"]') as HTMLButtonElement;
        expect(firstItem.textContent).toBe('rename');

        click(firstItem);
        await nextTick();

        expect(onSelect).toHaveBeenCalledWith(items[0], expect.any(CustomEvent));
        expect(queryDom(container, '[role="menu"]')).not.toBeNull();
    });

    it('keeps the convenience menu open when the select event is canceled', async () => {
        const onSelect = vi.fn((_item: DropdownMenuItem, event: CustomEvent) => {
            event.preventDefault();
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { items, onSelect },
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
        click(queryDom(container, '[role="menuitem"]') as HTMLButtonElement);
        await nextTick();

        expect(onSelect).toHaveBeenCalledWith(items[0], expect.any(CustomEvent));
        expect(queryDom(container, '[role="menu"]')).not.toBeNull();
    });

    it('teleports by default without treating menu items as outside clicks', async () => {
        const onSelect = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'portal-menu', items, arrow: true, onSelect },
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
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('[role="menu"]')).toBeNull();
        const menu = document.getElementById('portal-menu') as HTMLElement;
        expect(menu.style.position).toBe('absolute');
        expect(menu.querySelector('.rp-dropdown-menu__arrow')).not.toBeNull();

        const portalledItem = menu.querySelector('[role="menuitem"]') as HTMLButtonElement;
        portalledItem.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
        await nextTick();
        expect(document.getElementById('portal-menu')).toBe(menu);

        click(portalledItem);
        await waitDropdownTransition();
        expect(onSelect).toHaveBeenCalledWith(items[0], expect.any(CustomEvent));
        expect(document.getElementById('portal-menu')).toBeNull();
    });

    it('positions a controlled context menu from a reactive virtual target', async () => {
        const target = shallowRef<FloatingReference | null>(null);
        const open = ref(false);
        const container = mountDom(
            defineComponent({
                setup() {
                    function openAt(event: MouseEvent) {
                        target.value = {
                            contextElement: event.currentTarget as Element,
                            getBoundingClientRect: () =>
                                new DOMRect(event.clientX, event.clientY, 0, 0),
                        };
                        open.value = true;
                    }

                    return () =>
                        h(
                            'div',
                            { class: 'context-target', onContextmenu: openAt },
                            h(
                                DropdownMenu,
                                {
                                    id: 'virtual-menu',
                                    items,
                                    target,
                                    open: open.value,
                                    strategy: 'fixed',
                                    flip: false,
                                    shift: false,
                                    'onUpdate:open': (value: boolean) => {
                                        open.value = value;
                                    },
                                },
                                { default: () => null },
                            ),
                        );
                },
            }),
        );

        const contextTarget = container.querySelector('.context-target') as HTMLElement;
        contextTarget.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 42,
                clientY: 33,
            }),
        );

        await vi.waitFor(() => {
            const menu = document.getElementById('virtual-menu') as HTMLElement;
            expect(menu.style.position).toBe('fixed');
            expect(menu.style.left).toBe('42px');
            expect(menu.style.top).toBe('41px');
        });
        expect(contextTarget.hasAttribute('aria-controls')).toBe(false);

        contextTarget.dispatchEvent(
            new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                clientX: 80,
                clientY: 60,
            }),
        );
        await vi.waitFor(() => {
            const menu = document.getElementById('virtual-menu') as HTMLElement;
            expect(menu.style.left).toBe('80px');
            expect(menu.style.top).toBe('68px');
        });
    });

    it('does not evaluate descendants of collapsed submenus', async () => {
        const readFirstChildValue = vi.fn();
        const readSecondChildValue = vi.fn();
        const lazyItems: DropdownMenuItem[] = [
            {
                label: 'First branch',
                value: 'first',
                children: [
                    {
                        label: 'First child',
                        get value() {
                            readFirstChildValue();
                            return 'first-child';
                        },
                    },
                ],
            },
            {
                label: 'Second branch',
                value: 'second',
                children: [
                    {
                        label: 'Second child',
                        get value() {
                            readSecondChildValue();
                            return 'second-child';
                        },
                    },
                ],
            },
        ];
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'lazy-menu', items: lazyItems },
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

        expect(readFirstChildValue).not.toHaveBeenCalled();
        expect(readSecondChildValue).not.toHaveBeenCalled();

        click(document.getElementById('lazy-menu-item-0') as HTMLButtonElement);
        await nextTick();

        expect(readFirstChildValue).toHaveBeenCalled();
        expect(readSecondChildValue).not.toHaveBeenCalled();
    });

    it('rerenders only item rows whose focus state changes', async () => {
        const focusItems: DropdownMenuItem[] = [
            { label: 'First', value: 'first' },
            { label: 'Second', value: 'second' },
            { label: 'Third', value: 'third' },
        ];
        const renderItem = vi.fn((slotProps: DropdownMenuItemSlotProps) =>
            h('span', slotProps.item.label),
        );
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'focused-menu', items: focusItems },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            item: renderItem,
                        },
                    );
                },
            }),
        );

        keydown(queryDom(container, '.trigger') as HTMLButtonElement, 'ArrowDown');
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;
        const thirdItem = document.getElementById('focused-menu-item-2');
        renderItem.mockClear();

        keydown(menu, 'ArrowDown');
        await nextTick();

        expect(renderItem.mock.calls.map(([slotProps]) => slotProps.item.value)).toEqual([
            'first',
            'second',
        ]);
        expect(document.getElementById('focused-menu-item-2')).toBe(thirdItem);
    });

    it('preserves open submenu nodes while focus moves inside them', async () => {
        const nestedFocusItems: DropdownMenuItem[] = [
            {
                label: 'Move to',
                value: 'move',
                children: [
                    { label: 'Backlog', value: 'backlog' },
                    { label: 'Done', value: 'done' },
                    { label: 'Later', value: 'later' },
                ],
            },
            { label: 'Archive', value: 'archive' },
        ];
        const renderItem = vi.fn((slotProps: DropdownMenuItemSlotProps) =>
            h('span', slotProps.item.label),
        );
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        DropdownMenu,
                        { id: 'stable-submenu', items: nestedFocusItems },
                        {
                            default: ({ triggerProps }: DropdownMenuSlotProps) =>
                                h('button', { class: 'trigger', ...triggerProps }, 'Actions'),
                            item: renderItem,
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

        const submenu = document.getElementById('stable-submenu-submenu-0') as HTMLElement;
        const unaffectedRootItem = document.getElementById('stable-submenu-item-1');
        const unaffectedChild = document.getElementById('stable-submenu-item-0-2');
        renderItem.mockClear();

        keydown(menu, 'ArrowDown');
        await nextTick();

        expect(document.getElementById('stable-submenu-submenu-0')).toBe(submenu);
        expect(document.getElementById('stable-submenu-item-1')).toBe(unaffectedRootItem);
        expect(document.getElementById('stable-submenu-item-0-2')).toBe(unaffectedChild);
        expect(submenu.getAttribute('aria-activedescendant')).toBe('stable-submenu-item-0-1');
        expect(renderItem.mock.calls.map(([slotProps]) => slotProps.item.value)).toEqual([
            'backlog',
            'done',
        ]);
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

        click(queryDom(container, '.trigger') as HTMLButtonElement);
        await nextTick();

        const menu = queryDom(container, '[role="menu"]') as HTMLElement;

        expect(menu.getAttribute('aria-activedescendant')).toBeNull();
        expect(queryDomAll(container, '[role="menuitem"]')).toHaveLength(0);
        expect(queryDom(container, '.empty-slot')?.textContent).toBe('Nothing here');
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

        const roots = [...queryDomAll(container, '.rp-dropdown-menu')];

        expect(roots).toHaveLength(placements.length);
        for (const [index, placement] of placements.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-dropdown-menu',
                `rp-dropdown-menu--placement-${placement}`,
            ]);
        }
    });
});
