import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import {
    createDropdownMenuInteractionNavigation,
    type DropdownMenuInteractionNavigation,
} from './dropdownMenuInteractionNavigation';
import {
    createDropdownMenuInteractionRegistry,
    type DropdownMenuInteractionRegistryNavigation,
} from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteractionHost,
    DropdownMenuInteractionItemRegistration,
    DropdownMenuInteractionMenuRegistration,
} from './dropdownMenuInteractionTypes';

function createHost(open = false) {
    const isOpen = ref(open);
    const disabled = ref(false);
    const modal = ref(false);
    const host: DropdownMenuInteractionHost = {
        rootMenuId: 'root-menu',
        isOpen,
        disabled,
        modal,
        setOpen: (value) => {
            isOpen.value = value;
        },
        isTopLayer: () => true,
        focusTrigger: vi.fn(),
    };

    return { host, isOpen };
}

function createMenu(
    id: string,
    options: Partial<DropdownMenuInteractionMenuRegistration> = {},
): DropdownMenuInteractionMenuRegistration {
    return {
        id,
        element: () => null,
        placement: () => 'bottom-start',
        isOpen: () => false,
        ...options,
    };
}

function createItem(
    id: string,
    menuId: string,
    options: Partial<DropdownMenuInteractionItemRegistration> = {},
): DropdownMenuInteractionItemRegistration {
    return {
        id,
        menuId,
        element: () => null,
        textValue: () => id,
        disabled: () => false,
        ...options,
    };
}

describe('dropdown menu interaction registry', () => {
    it('orders items, tracks active state, and chooses a neighbor after removal', () => {
        const { host } = createHost();
        const navigation: DropdownMenuInteractionRegistryNavigation = {
            closeMenu: vi.fn(() => false),
            closeSubmenus: vi.fn(),
            focusMenu: vi.fn(() => false),
            reconcile: vi.fn(),
            reconcileOpenSubmenus: vi.fn(),
        };
        const registry = createDropdownMenuInteractionRegistry(host, navigation);
        const alpha = createItem('alpha', host.rootMenuId, { order: () => 0 });
        const beta = createItem('beta', host.rootMenuId, { order: () => 1 });

        registry.registerItem(beta);
        registry.registerItem(alpha);

        expect(registry.state.getItems(host.rootMenuId).map(({ id }) => id)).toEqual([
            'alpha',
            'beta',
        ]);
        expect(registry.setActive('beta')).toBe(true);
        expect(registry.activeItemId.value).toBe('beta');
        expect(registry.isActive('beta')).toBe(true);

        registry.unregisterItem('beta');

        expect(registry.activeItemId.value).toBe('alpha');
        expect(registry.getActiveId(host.rootMenuId).value).toBe('alpha');
        expect(navigation.reconcileOpenSubmenus).toHaveBeenCalled();
    });

    it('keeps only the latest registration cleanup authoritative', () => {
        const { host } = createHost();
        const navigation: DropdownMenuInteractionRegistryNavigation = {
            closeMenu: vi.fn(() => false),
            closeSubmenus: vi.fn(),
            focusMenu: vi.fn(() => false),
            reconcile: vi.fn(),
            reconcileOpenSubmenus: vi.fn(),
        };
        const registry = createDropdownMenuInteractionRegistry(host, navigation);
        const first = createItem('item', host.rootMenuId);
        const replacement = createItem('item', host.rootMenuId, {
            textValue: () => 'replacement',
        });

        const cleanupFirst = registry.registerItem(first);
        const cleanupReplacement = registry.registerItem(replacement);
        cleanupFirst();

        expect(registry.getItem('item')).toBe(replacement);

        cleanupReplacement();
        expect(registry.getItem('item')).toBeUndefined();
    });

    it('honors pending submenu focus when its menu registers open', async () => {
        const { host } = createHost();
        const navigation: DropdownMenuInteractionRegistryNavigation = {
            closeMenu: vi.fn(() => false),
            closeSubmenus: vi.fn(),
            focusMenu: vi.fn(() => true),
            reconcile: vi.fn(),
            reconcileOpenSubmenus: vi.fn(),
        };
        const registry = createDropdownMenuInteractionRegistry(host, navigation);
        registry.state.setPendingMenuFocus('submenu', 'last');

        registry.registerMenu(createMenu('submenu', { isOpen: () => true }));
        await nextTick();

        expect(navigation.focusMenu).toHaveBeenCalledWith('submenu', 'last');
    });
});

describe('dropdown menu interaction navigation', () => {
    it('opens and closes submenus while restoring their parent item', () => {
        const { host } = createHost(true);
        const closeRoot = vi.fn();
        let navigation!: DropdownMenuInteractionNavigation;
        const registry = createDropdownMenuInteractionRegistry(host, {
            closeMenu: (menuId, focusParent) => navigation.closeMenu(menuId, focusParent),
            closeSubmenus: (menuId, exceptMenuId) => navigation.closeSubmenus(menuId, exceptMenuId),
            focusMenu: (menuId, target) => navigation.focusMenu(menuId, target),
            reconcile: (menuId) => navigation.reconcile(menuId),
            reconcileOpenSubmenus: () => navigation.reconcileOpenSubmenus(),
        });
        navigation = createDropdownMenuInteractionNavigation({
            host,
            registry,
            closeRoot,
        });
        const submenuOpen = ref(false);

        registry.registerMenu(createMenu(host.rootMenuId, { isOpen: () => true }));
        registry.registerMenu(
            createMenu('submenu', {
                parentItemId: () => 'parent',
                isOpen: () => submenuOpen.value,
                setOpen: (open) => {
                    submenuOpen.value = open;
                },
            }),
        );
        registry.registerItem(
            createItem('parent', host.rootMenuId, { submenuId: () => 'submenu' }),
        );
        registry.registerItem(createItem('child', 'submenu'));

        expect(navigation.openMenu('submenu', 'first')).toBe(true);
        expect(submenuOpen.value).toBe(true);
        expect(registry.activeItemId.value).toBe('child');
        expect(registry.activeMenuId.value).toBe('submenu');

        expect(navigation.closeMenu('submenu', true)).toBe(true);
        expect(submenuOpen.value).toBe(false);
        expect(registry.activeItemId.value).toBe('parent');
        expect(registry.activeMenuId.value).toBe(host.rootMenuId);
    });

    it('closes the root after uncanceled selection and preserves canceled selection', () => {
        const { host } = createHost();
        const closeRoot = vi.fn();
        let navigation!: DropdownMenuInteractionNavigation;
        const registry = createDropdownMenuInteractionRegistry(host, {
            closeMenu: (menuId, focusParent) => navigation.closeMenu(menuId, focusParent),
            closeSubmenus: (menuId, exceptMenuId) => navigation.closeSubmenus(menuId, exceptMenuId),
            focusMenu: (menuId, target) => navigation.focusMenu(menuId, target),
            reconcile: (menuId) => navigation.reconcile(menuId),
            reconcileOpenSubmenus: () => navigation.reconcileOpenSubmenus(),
        });
        navigation = createDropdownMenuInteractionNavigation({
            host,
            registry,
            closeRoot,
        });
        const originalEvent = new Event('click');

        registry.registerItem(
            createItem('selectable', host.rootMenuId, {
                select: (event) =>
                    new CustomEvent('select', {
                        cancelable: true,
                        detail: { originalEvent: event, value: 'selectable' },
                    }),
            }),
        );
        navigation.selectItem('selectable', originalEvent);

        expect(closeRoot).toHaveBeenCalledWith({ focusTrigger: true });

        closeRoot.mockClear();
        registry.registerItem(
            createItem('selectable', host.rootMenuId, {
                select: (event) => {
                    const selectEvent = new CustomEvent('select', {
                        cancelable: true,
                        detail: { originalEvent: event, value: 'selectable' },
                    });
                    selectEvent.preventDefault();
                    return selectEvent;
                },
            }),
        );
        navigation.selectItem('selectable', originalEvent);

        expect(closeRoot).not.toHaveBeenCalled();
    });
});
