import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import {
    buildDropdownMenuDataIndex,
    getDropdownMenuDataCollectionState,
    type DropdownMenuDataEntry,
    type DropdownMenuDataIndex,
} from './dropdownMenuDataModel';
import type {
    DropdownMenuInteractionRuntime,
    DropdownMenuInteractionMenuRegistration,
} from './dropdownMenuInteraction';
import type {
    DropdownMenuItem,
    DropdownMenuPlacement,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import type { ItemPath } from './dropdown-menu-model';

type DropdownMenuDataInteraction = Pick<
    DropdownMenuInteractionRuntime,
    'reconcile' | 'registerItem' | 'registerMenu' | 'unregisterItem' | 'unregisterMenu'
>;

interface UseDropdownMenuDataRegistrationOptions {
    props: Readonly<DropdownMenuProps>;
    items: Readonly<Ref<DropdownMenuItem[]>>;
    rootMenuId: string;
    interaction: DropdownMenuDataInteraction;
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
    menuRef,
    getItemElement,
    getSubmenuElement,
    isSubmenuOpeningLeft,
    onSelect,
}: UseDropdownMenuDataRegistrationOptions) {
    const openMenuIds = ref(new Set<string>());
    const itemIdentity = new WeakMap<DropdownMenuItem, string>();
    let nextItemIdentity = 0;
    let registeredItemIds = new Set<string>();
    let registeredMenuIds = new Set<string>();

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

    function createMenuRegistration(
        index: DropdownMenuDataIndex,
        entry: DropdownMenuDataEntry,
    ): DropdownMenuInteractionMenuRegistration | undefined {
        const submenuMenuId = entry.submenuMenuId;
        if (!submenuMenuId) return undefined;

        return {
            id: submenuMenuId,
            parentItemId: () => entry.itemId,
            element: () => getSubmenuElement(getCurrentPath(index, entry)),
            focusTarget: () => menuRef.value,
            placement: () => {
                const value = getSubmenuElement(getCurrentPath(index, entry))?.dataset.placement;
                return (value as DropdownMenuPlacement) ?? 'right-start';
            },
            isOpen: () => openMenuIds.value.has(submenuMenuId),
            setOpen: (open) => setMenuOpen(submenuMenuId, open),
        };
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

    function registerEntry(index: DropdownMenuDataIndex, entry: DropdownMenuDataEntry) {
        const menuRegistration = createMenuRegistration(index, entry);
        if (menuRegistration) interaction.registerMenu(menuRegistration);

        interaction.registerItem({
            id: entry.itemId,
            menuId: entry.ownerMenuId,
            element: () => getItemElement(getCurrentPath(index, entry)),
            textValue: () => entry.item.label,
            disabled: () => Boolean(entry.item.disabled || props.disabled),
            order: () => entry.order,
            submenuId: () => entry.submenuMenuId,
            submenuDirection: () =>
                isSubmenuOpeningLeft(getCurrentPath(index, entry)) ? 'left' : 'right',
            select: (originalEvent) => createSelectEvent(entry, originalEvent),
            closeOnSelect: () => props.closeOnSelect !== false,
        });
    }

    function unregisterStaleEntries(
        nextRegisteredItemIds: ReadonlySet<string>,
        nextRegisteredMenuIds: ReadonlySet<string>,
    ) {
        for (const id of registeredItemIds) {
            if (!nextRegisteredItemIds.has(id)) interaction.unregisterItem(id);
        }
        for (const id of registeredMenuIds) {
            if (nextRegisteredMenuIds.has(id)) continue;
            interaction.unregisterMenu(id);
            setMenuOpen(id, false);
        }
    }

    function registerItems() {
        const nextIndex = buildDropdownMenuDataIndex(items.value, rootMenuId, getStableItemId);
        const nextRegisteredItemIds = new Set(nextIndex.entries.map((entry) => entry.itemId));
        const nextRegisteredMenuIds = new Set(
            nextIndex.entries.flatMap((entry) =>
                entry.submenuMenuId ? [entry.submenuMenuId] : [],
            ),
        );

        for (const entry of nextIndex.entries) registerEntry(nextIndex, entry);
        unregisterStaleEntries(nextRegisteredItemIds, nextRegisteredMenuIds);
        registeredItemIds = nextRegisteredItemIds;
        registeredMenuIds = nextRegisteredMenuIds;
        registrationIndex.value = nextIndex;
        interaction.reconcile();
    }

    watch(collectionState, registerItems, { immediate: true });

    return {
        openMenuIds,
        registrationIndex,
    };
}
