import { computed, onBeforeUnmount, ref, shallowRef, watch, type Ref } from 'vue';
import {
    buildDropdownMenuDataIndex,
    getDropdownMenuDataCollectionState,
    type DropdownMenuDataEntry,
    type DropdownMenuDataIndex,
} from './dropdownMenuDataModel';
import type {
    DropdownMenuInteraction,
    DropdownMenuInteractionItem,
    DropdownMenuInteractionMenu,
    DropdownMenuInteractionSubmenu,
} from './dropdownMenuInteraction';
import type {
    DropdownMenuItem,
    DropdownMenuPlacement,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import type { ItemPath } from './dropdown-menu-model';

interface UseDropdownMenuDataRegistrationOptions {
    props: Readonly<DropdownMenuProps>;
    items: Readonly<Ref<DropdownMenuItem[]>>;
    rootMenuId: string;
    interaction: DropdownMenuInteraction;
    rootMenu: DropdownMenuInteractionMenu;
    menuRef: Readonly<Ref<HTMLElement | null>>;
    getItemElement: (path: ItemPath) => HTMLElement | null;
    getSubmenuElement: (path: ItemPath) => HTMLElement | null;
    isSubmenuOpeningLeft: (path: ItemPath) => boolean;
    onSelect?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
}

function getCurrentPath(index: DropdownMenuDataIndex, entry: DropdownMenuDataEntry) {
    return index.pathByItemId.get(entry.itemId) ?? entry.path;
}

export function useDropdownMenuDataRegistration({
    props,
    items,
    rootMenuId,
    interaction,
    rootMenu,
    menuRef,
    getItemElement,
    getSubmenuElement,
    isSubmenuOpeningLeft,
    onSelect,
}: UseDropdownMenuDataRegistrationOptions) {
    const openMenuIds = ref(new Set<string>());
    const itemIdentity = new WeakMap<DropdownMenuItem, string>();
    let nextItemIdentity = 0;
    let itemInteractions = new Map<string, DropdownMenuInteractionItem>();
    let menuInteractions = new Map<string, DropdownMenuInteractionMenu>([[rootMenuId, rootMenu]]);
    let submenuInteractions = new Map<string, DropdownMenuInteractionSubmenu>();

    function getStableItemId(item: DropdownMenuItem) {
        const existing = itemIdentity.get(item);
        if (existing) return existing;

        nextItemIdentity += 1;
        const id = `${rootMenuId}-item-${nextItemIdentity}`;
        itemIdentity.set(item, id);
        return id;
    }

    const registrationIndex = shallowRef(
        buildDropdownMenuDataIndex([], rootMenuId, getStableItemId),
    );
    const collectionState = computed(() => getDropdownMenuDataCollectionState(items.value));

    function setMenuOpen(id: string, open: boolean) {
        const next = new Set(openMenuIds.value);
        if (open) next.add(id);
        else next.delete(id);
        openMenuIds.value = next;
    }

    function connectSubmenu(index: DropdownMenuDataIndex, entry: DropdownMenuDataEntry) {
        const submenuMenuId = entry.submenuMenuId;
        if (!submenuMenuId) return undefined;

        const submenu = interaction.connectSubmenu({
            id: submenuMenuId,
            parentItemId: () => entry.itemId,
            isOpen: () => openMenuIds.value.has(submenuMenuId),
            setOpen: (open) => setMenuOpen(submenuMenuId, open),
        });
        const menu = submenu.connectContent({
            element: () => getSubmenuElement(getCurrentPath(index, entry)),
            focusTarget: () => menuRef.value,
            placement: () => {
                const value = getSubmenuElement(getCurrentPath(index, entry))?.dataset.placement;
                return (value as DropdownMenuPlacement) ?? 'right-start';
            },
        });
        return { menu, submenu };
    }

    function createSelectEvent(entry: DropdownMenuDataEntry, originalEvent: Event) {
        const event = new CustomEvent('dropdown-menu-select', {
            cancelable: true,
            detail: {
                originalEvent,
                value: entry.item.value,
            },
        }) as DropdownMenuSelectEvent;
        onSelect?.(entry.item, event);
        return event;
    }

    function connectItem(
        index: DropdownMenuDataIndex,
        entry: DropdownMenuDataEntry,
        nextMenus: ReadonlyMap<string, DropdownMenuInteractionMenu>,
        nextSubmenus: ReadonlyMap<string, DropdownMenuInteractionSubmenu>,
    ) {
        const menu = nextMenus.get(entry.ownerMenuId);
        if (!menu) return undefined;

        return menu.connectItem({
            id: entry.itemId,
            element: () => getItemElement(getCurrentPath(index, entry)),
            textValue: () => entry.item.label,
            disabled: () => Boolean(entry.item.disabled || props.disabled),
            order: () => entry.order,
            submenu: entry.submenuMenuId ? nextSubmenus.get(entry.submenuMenuId) : undefined,
            submenuDirection: () =>
                isSubmenuOpeningLeft(getCurrentPath(index, entry)) ? 'left' : 'right',
            select: (originalEvent) => createSelectEvent(entry, originalEvent),
            closeOnSelect: () => props.closeOnSelect !== false,
        });
    }

    function registerItems() {
        const nextIndex = buildDropdownMenuDataIndex(items.value, rootMenuId, getStableItemId);
        const nextItems = new Map<string, DropdownMenuInteractionItem>();
        const nextMenus = new Map<string, DropdownMenuInteractionMenu>([[rootMenuId, rootMenu]]);
        const nextSubmenus = new Map<string, DropdownMenuInteractionSubmenu>();

        for (const entry of nextIndex.entries) {
            const connection = connectSubmenu(nextIndex, entry);
            if (!entry.submenuMenuId || !connection) continue;
            nextMenus.set(entry.submenuMenuId, connection.menu);
            nextSubmenus.set(entry.submenuMenuId, connection.submenu);
        }
        for (const entry of nextIndex.entries) {
            const item = connectItem(nextIndex, entry, nextMenus, nextSubmenus);
            if (item) nextItems.set(entry.itemId, item);
        }

        for (const item of itemInteractions.values()) item.dispose();
        for (const submenu of submenuInteractions.values()) submenu.dispose();

        itemInteractions = nextItems;
        menuInteractions = nextMenus;
        submenuInteractions = nextSubmenus;
        registrationIndex.value = nextIndex;
    }

    watch(collectionState, registerItems, { immediate: true });
    onBeforeUnmount(() => {
        for (const item of itemInteractions.values()) item.dispose();
        for (const submenu of submenuInteractions.values()) submenu.dispose();
    });

    return {
        openMenuIds,
        registrationIndex,
        getItemInteraction: (id: string) => itemInteractions.get(id),
        getMenuInteraction: (id: string) => menuInteractions.get(id),
    };
}
