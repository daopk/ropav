import { getPathKey } from '@/utils/indexPath';
import { hasItemSubmenu, type ItemPath } from './dropdown-menu-model';
import type { DropdownMenuItem } from './types';

export interface DropdownMenuDataEntry {
    item: DropdownMenuItem;
    path: ItemPath;
    itemId: string;
    ownerMenuId: string;
    order: number;
    submenuMenuId: string | undefined;
}

export interface DropdownMenuDataIndex {
    entries: readonly DropdownMenuDataEntry[];
    itemIdByPath: ReadonlyMap<string, string>;
    pathByItemId: ReadonlyMap<string, ItemPath>;
    menuIdByPath: ReadonlyMap<string, string>;
    pathByMenuId: ReadonlyMap<string, ItemPath>;
    primaryItemId: WeakMap<DropdownMenuItem, string>;
}

interface DropdownMenuDataIndexState {
    entries: DropdownMenuDataEntry[];
    itemIdByPath: Map<string, string>;
    pathByItemId: Map<string, ItemPath>;
    menuIdByPath: Map<string, string>;
    pathByMenuId: Map<string, ItemPath>;
    primaryItemId: WeakMap<DropdownMenuItem, string>;
    occurrences: Map<DropdownMenuItem, number>;
}

function createDataIndexState(rootMenuId: string): DropdownMenuDataIndexState {
    return {
        entries: [],
        itemIdByPath: new Map(),
        pathByItemId: new Map(),
        menuIdByPath: new Map([['root', rootMenuId]]),
        pathByMenuId: new Map([[rootMenuId, []]]),
        primaryItemId: new WeakMap(),
        occurrences: new Map(),
    };
}

function getOccurrenceItemId(
    item: DropdownMenuItem,
    state: DropdownMenuDataIndexState,
    getStableItemId: (item: DropdownMenuItem) => string,
) {
    const occurrence = state.occurrences.get(item) ?? 0;
    state.occurrences.set(item, occurrence + 1);
    const stableItemId = getStableItemId(item);

    return {
        occurrence,
        itemId: occurrence === 0 ? stableItemId : `${stableItemId}-copy-${occurrence}`,
    };
}

function indexItems(
    items: readonly DropdownMenuItem[],
    parentPath: ItemPath,
    ownerMenuId: string,
    state: DropdownMenuDataIndexState,
    getStableItemId: (item: DropdownMenuItem) => string,
) {
    for (const [order, item] of items.entries()) {
        const path = [...parentPath, order];
        const pathKey = getPathKey(path);
        const { itemId, occurrence } = getOccurrenceItemId(item, state, getStableItemId);
        const submenuMenuId = hasItemSubmenu(item) ? `${itemId}-menu` : undefined;

        state.entries.push({ item, path, itemId, ownerMenuId, order, submenuMenuId });
        state.itemIdByPath.set(pathKey, itemId);
        state.pathByItemId.set(itemId, path);
        if (occurrence === 0) state.primaryItemId.set(item, itemId);

        if (!submenuMenuId) continue;
        state.menuIdByPath.set(pathKey, submenuMenuId);
        state.pathByMenuId.set(submenuMenuId, path);
        indexItems(item.children ?? [], path, submenuMenuId, state, getStableItemId);
    }
}

export function buildDropdownMenuDataIndex(
    items: readonly DropdownMenuItem[],
    rootMenuId: string,
    getStableItemId: (item: DropdownMenuItem) => string,
): DropdownMenuDataIndex {
    const state = createDataIndexState(rootMenuId);
    indexItems(items, [], rootMenuId, state, getStableItemId);

    return {
        entries: state.entries,
        itemIdByPath: state.itemIdByPath,
        pathByItemId: state.pathByItemId,
        menuIdByPath: state.menuIdByPath,
        pathByMenuId: state.pathByMenuId,
        primaryItemId: state.primaryItemId,
    };
}

export function getDropdownMenuDataCollectionState(items: readonly DropdownMenuItem[]) {
    const state: unknown[] = [];

    function collect(currentItems: readonly DropdownMenuItem[]) {
        state.push(currentItems.length);
        for (const item of currentItems) {
            const children = item.children;
            state.push(item, Boolean(item.disabled), children);
            if (children) collect(children);
        }
    }

    collect(items);
    return state;
}
