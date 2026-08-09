import type {UseSelectionManagerReturn} from "@/composables/use-selection-manager";
import type {DragCollection, DragCollectionNode, DragKey} from "@/utils/dnd-types";

import {computed, shallowRef} from "vue";

/**
 * Stand-ins for the two things the drag and drop layer reads.
 *
 * The layer names only the slice of a collection it needs, so a test can supply that directly
 * instead of mounting a real ListBox or Table. Everything here is plain data; nothing touches
 * the DOM.
 */

export interface FixtureItem {
  key: DragKey;
  /** Omit for a top-level item. Children must be listed after their parent. */
  parentKey?: DragKey | null;
  /** Anything other than `"item"` is a row that is not a drop target. */
  type?: string;
  /** What a drop indicator names the item by. Defaults to the key. */
  textValue?: string;
  value?: unknown;
}

/**
 * Build a collection from a list given in **document order** — the order rows would render,
 * with each child following its parent.
 *
 * Two orders come out of that and they are not the same: `prevKey`/`nextKey` link **siblings**,
 * while `getKeyAfter`/`getKeyBefore` walk **document order** and descend into children. Drag
 * navigation needs both, and conflating them is the easiest way to get tree traversal wrong.
 */
export const createFixtureCollection = (items: FixtureItem[]): DragCollection<unknown> => {
  const order = items.map((item) => item.key);
  const nodes = new Map<DragKey, DragCollectionNode<unknown>>();
  const siblingsByParent = new Map<DragKey | null, DragKey[]>();
  const levels = new Map<DragKey, number>();

  for (const item of items) {
    const parentKey = item.parentKey ?? null;
    const siblings = siblingsByParent.get(parentKey) ?? [];

    siblings.push(item.key);
    siblingsByParent.set(parentKey, siblings);
    levels.set(item.key, parentKey == null ? 0 : (levels.get(parentKey) ?? 0) + 1);
  }

  for (const item of items) {
    const parentKey = item.parentKey ?? null;
    const siblings = siblingsByParent.get(parentKey)!;
    const index = siblings.indexOf(item.key);
    const children = siblingsByParent.get(item.key) ?? [];

    nodes.set(item.key, {
      key: item.key,
      lastChildKey: children[children.length - 1] ?? null,
      level: levels.get(item.key) ?? 0,
      nextKey: siblings[index + 1] ?? null,
      parentKey,
      prevKey: siblings[index - 1] ?? null,
      textValue: item.textValue ?? String(item.key),
      type: item.type ?? "item",
      value: item.value ?? {id: item.key},
    });
  }

  return {
    getItem: (key) => nodes.get(key) ?? null,
    getKeyAfter: (key) => order[order.indexOf(key) + 1] ?? null,
    getKeyBefore: (key) => {
      const index = order.indexOf(key);

      return index > 0 ? (order[index - 1] ?? null) : null;
    },
    getKeys: () => order,
  };
};

/**
 * A keyboard delegate that walks document order, as a flat list's would.
 *
 * Only item rows are included. A real delegate navigates what can hold focus, and a loader row
 * or section header cannot — the traversal under test trusts that and does not re-check.
 */
export const createFixtureKeyboardDelegate = (collection: DragCollection<unknown>) => {
  const keys = [...collection.getKeys()].filter(
    (key) => (collection.getItem(key)?.type ?? "item") === "item",
  );

  return {
    getFirstKey: () => keys[0] ?? null,
    getKeyAbove: (key: DragKey) => {
      const index = keys.indexOf(key);

      return index > 0 ? (keys[index - 1] ?? null) : null;
    },
    getKeyBelow: (key: DragKey) => keys[keys.indexOf(key) + 1] ?? null,
    getLastKey: () => keys[keys.length - 1] ?? null,
  };
};

/**
 * A selection manager with the members the drag and drop layer reads.
 *
 * Not the real one: `useSelectionManager` has thirty members and needs a live collection, so
 * standing it up here would test that instead of what is under test. What it does have to cover
 * is everything the collection-level hooks touch — focus and selection both, because a drop
 * decides where focus lands afterwards.
 */
export const createFixtureSelection = (
  selected: DragKey[] = [],
  options: {focusedKey?: DragKey | null; selectionMode?: string} = {},
): UseSelectionManagerReturn & {focusedCalls: boolean[]} => {
  const keys = shallowRef(new Set(selected));
  const focusedKey = shallowRef<DragKey | null>(options.focusedKey ?? null);
  const focusedCalls: boolean[] = [];

  return {
    firstSelectedKey: computed(() => [...keys.value][0] ?? null),
    focusedCalls,
    focusedKey: computed(() => focusedKey.value),
    isSelected: (key: DragKey) => keys.value.has(key),
    lastSelectedKey: computed(() => [...keys.value][keys.value.size - 1] ?? null),
    selectedKeys: computed(() => keys.value),
    selectionMode: computed(() => options.selectionMode ?? "multiple"),
    setFocused: (isFocused: boolean) => focusedCalls.push(isFocused),
    setFocusedKey: (key: DragKey | null) => (focusedKey.value = key),
    setSelectedKeys: (next: Iterable<DragKey>) => (keys.value = new Set(next)),
  } as unknown as UseSelectionManagerReturn & {focusedCalls: boolean[]};
};

/** A `DragTypes` over a fixed set, matching the real wildcard rules closely enough for these. */
export const createFixtureTypes = (types: string[]) => ({
  has: (type: string | symbol | (string | symbol)[]): boolean => {
    if (Array.isArray(type)) return type.some((candidate) => types.includes(candidate as string));
    if (type === "*/*") return true;

    return typeof type === "string" && types.includes(type);
  },
});
