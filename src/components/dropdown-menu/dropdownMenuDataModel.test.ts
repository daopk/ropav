import { describe, expect, it, vi } from 'vitest';
import {
    buildDropdownMenuDataIndex,
    getDropdownMenuDataCollectionState,
} from './dropdownMenuDataModel';
import type { DropdownMenuItem } from './types';

function createStableItemIdResolver() {
    const itemIds = new Map<DropdownMenuItem, string>();
    let nextId = 0;

    return (item: DropdownMenuItem) => {
        const existing = itemIds.get(item);
        if (existing) return existing;

        nextId += 1;
        const id = `root-item-${nextId}`;
        itemIds.set(item, id);
        return id;
    };
}

describe('dropdown menu data model', () => {
    it('indexes nested items and their owning menus in depth-first order', () => {
        const backlog: DropdownMenuItem = { label: 'Backlog', value: 'backlog' };
        const done: DropdownMenuItem = { label: 'Done', value: 'done' };
        const move: DropdownMenuItem = {
            label: 'Move to',
            value: 'move',
            children: [backlog, done],
        };
        const archive: DropdownMenuItem = { label: 'Archive', value: 'archive' };

        const index = buildDropdownMenuDataIndex(
            [move, archive],
            'root-menu',
            createStableItemIdResolver(),
        );

        expect(
            index.entries.map(({ item, itemId, ownerMenuId, order, path, submenuMenuId }) => ({
                value: item.value,
                itemId,
                ownerMenuId,
                order,
                path,
                submenuMenuId,
            })),
        ).toEqual([
            {
                value: 'move',
                itemId: 'root-item-1',
                ownerMenuId: 'root-menu',
                order: 0,
                path: [0],
                submenuMenuId: 'root-item-1-menu',
            },
            {
                value: 'backlog',
                itemId: 'root-item-2',
                ownerMenuId: 'root-item-1-menu',
                order: 0,
                path: [0, 0],
                submenuMenuId: undefined,
            },
            {
                value: 'done',
                itemId: 'root-item-3',
                ownerMenuId: 'root-item-1-menu',
                order: 1,
                path: [0, 1],
                submenuMenuId: undefined,
            },
            {
                value: 'archive',
                itemId: 'root-item-4',
                ownerMenuId: 'root-menu',
                order: 1,
                path: [1],
                submenuMenuId: undefined,
            },
        ]);
        expect([...index.itemIdByPath]).toEqual([
            ['0', 'root-item-1'],
            ['0-0', 'root-item-2'],
            ['0-1', 'root-item-3'],
            ['1', 'root-item-4'],
        ]);
        expect(index.pathByItemId.get('root-item-3')).toEqual([0, 1]);
        expect([...index.menuIdByPath]).toEqual([
            ['root', 'root-menu'],
            ['0', 'root-item-1-menu'],
        ]);
        expect(index.pathByMenuId.get('root-menu')).toEqual([]);
        expect(index.pathByMenuId.get('root-item-1-menu')).toEqual([0]);
        expect(index.primaryItemId.get(move)).toBe('root-item-1');
    });

    it('keeps item identities stable while paths and order change', () => {
        const alpha: DropdownMenuItem = { label: 'Alpha', value: 'alpha' };
        const beta: DropdownMenuItem = { label: 'Beta', value: 'beta' };
        const getStableItemId = createStableItemIdResolver();

        const initial = buildDropdownMenuDataIndex([alpha, beta], 'root-menu', getStableItemId);
        const reordered = buildDropdownMenuDataIndex([beta, alpha], 'root-menu', getStableItemId);

        expect(initial.primaryItemId.get(alpha)).toBe('root-item-1');
        expect(initial.primaryItemId.get(beta)).toBe('root-item-2');
        expect(reordered.itemIdByPath.get('0')).toBe('root-item-2');
        expect(reordered.itemIdByPath.get('1')).toBe('root-item-1');
        expect(reordered.pathByItemId.get('root-item-2')).toEqual([0]);
        expect(reordered.entries.map(({ order }) => order)).toEqual([0, 1]);
    });

    it('assigns occurrence ids when the same item object appears more than once', () => {
        const shared: DropdownMenuItem = { label: 'Shared', value: 'shared' };
        const parent: DropdownMenuItem = {
            label: 'Parent',
            value: 'parent',
            children: [shared],
        };

        const index = buildDropdownMenuDataIndex(
            [shared, parent],
            'root-menu',
            createStableItemIdResolver(),
        );

        expect(index.itemIdByPath.get('0')).toBe('root-item-1');
        expect(index.itemIdByPath.get('1-0')).toBe('root-item-1-copy-1');
        expect(index.pathByItemId.get('root-item-1-copy-1')).toEqual([1, 0]);
        expect(index.primaryItemId.get(shared)).toBe('root-item-1');
    });

    it('does not create a submenu registration for an empty children array', () => {
        const item: DropdownMenuItem = {
            label: 'Empty parent',
            value: 'empty',
            children: [],
        };

        const index = buildDropdownMenuDataIndex([item], 'root-menu', createStableItemIdResolver());

        expect(index.entries[0]?.submenuMenuId).toBeUndefined();
        expect([...index.menuIdByPath]).toEqual([['root', 'root-menu']]);
    });

    it('tracks structural and disabled changes without reading render-only values', () => {
        const readLabel = vi.fn();
        const readValue = vi.fn();
        const readDisabled = vi.fn();
        const readChildren = vi.fn();
        const child: DropdownMenuItem = { label: 'Child', value: 'child' };
        const children = [child];
        const item: DropdownMenuItem = {
            get label() {
                readLabel();
                return 'Parent';
            },
            get value() {
                readValue();
                return 'parent';
            },
            get disabled() {
                readDisabled();
                return true;
            },
            get children() {
                readChildren();
                return children;
            },
        };

        const state = getDropdownMenuDataCollectionState([item]);

        expect(readDisabled).toHaveBeenCalledOnce();
        expect(readChildren).toHaveBeenCalledOnce();
        expect(readLabel).not.toHaveBeenCalled();
        expect(readValue).not.toHaveBeenCalled();
        expect(state).toContain(item);
        expect(state).toContain(child);
        expect(state).toContain(children);
        expect(state).toContain(true);
    });
});
