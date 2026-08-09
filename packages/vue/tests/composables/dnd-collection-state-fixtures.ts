import type {UseSelectionManagerReturn} from "@/composables/use-selection-manager";
import type {DragCollection, DragCollectionNode, DragKey} from "@/utils/dnd-types";

import {computed, shallowRef} from "vue";

/**
 * Stand-ins for the two things the drag and drop state layer reads.
 *
 * The state layer names only the slice of a collection it needs — parent, siblings and value —
 * so a test can supply that directly instead of mounting a real ListBox or Table. Everything
 * here is plain data; nothing touches the DOM.
 */

export interface FixtureItem {
  key: DragKey;
  parentKey?: DragKey | null;
  value?: unknown;
}

/**
 * Build a collection from a flat list, deriving siblings from adjacency within a parent.
 *
 * `prevKey`/`nextKey` are sibling links rather than "the row above" — a child's next sibling is
 * the next item sharing its parent, not the next item in the list.
 */
export const createFixtureCollection = (items: FixtureItem[]): DragCollection<unknown> => {
  const nodes = new Map<DragKey, DragCollectionNode<unknown>>();
  const siblingsByParent = new Map<DragKey | null, DragKey[]>();

  for (const item of items) {
    const parentKey = item.parentKey ?? null;
    const siblings = siblingsByParent.get(parentKey) ?? [];

    siblings.push(item.key);
    siblingsByParent.set(parentKey, siblings);
  }

  for (const item of items) {
    const parentKey = item.parentKey ?? null;
    const siblings = siblingsByParent.get(parentKey)!;
    const index = siblings.indexOf(item.key);

    nodes.set(item.key, {
      key: item.key,
      nextKey: siblings[index + 1] ?? null,
      parentKey,
      prevKey: siblings[index - 1] ?? null,
      value: item.value ?? {id: item.key},
    });
  }

  return {getItem: (key) => nodes.get(key) ?? null};
};

/**
 * A selection manager with only the three members the drag state reads.
 *
 * Cast rather than implemented in full: `useSelectionManager` has thirty members and the drag
 * layer touches `isSelected`, `selectedKeys` and `setFocused`. Standing up the real one would
 * need a real collection and would test that instead of this.
 */
export const createFixtureSelection = (
  selected: DragKey[] = [],
): UseSelectionManagerReturn & {focusedCalls: boolean[]} => {
  const keys = shallowRef(new Set(selected));
  const focusedCalls: boolean[] = [];

  return {
    focusedCalls,
    isSelected: (key: DragKey) => keys.value.has(key),
    selectedKeys: computed(() => keys.value),
    setFocused: (isFocused: boolean) => focusedCalls.push(isFocused),
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
