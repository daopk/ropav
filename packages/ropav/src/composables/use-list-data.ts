/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * This file is based on the useListData hook from @react-stately/data package.
 * Original source: https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/data/src/useListData.ts
 *
 * Why we copied this code instead of using @react-stately/data as a dependency:
 * We copied this implementation to avoid adding @react-stately/data as a dependency, which is a
 * large package that would significantly increase our bundle size. We maintain full attribution to
 * Adobe and comply with the Apache License 2.0 requirements.
 */

import type { CollectionKey } from "./use-collection";
import type { CollectionSelection } from "./use-selection-manager";
import type { ComputedRef } from "vue";

import { computed, shallowRef } from "vue";

export interface UseListDataOptions<T> {
  /** Initial items in the list. */
  initialItems?: T[];
  /** The keys for the initially selected items. */
  initialSelectedKeys?: "all" | Iterable<CollectionKey>;
  /** The initial text to filter the list by. */
  initialFilterText?: string;
  /** A function that returns a unique key for an item object. */
  getKey?: (item: T) => CollectionKey;
  /** A function that returns whether an item matches the current filter text. */
  filter?: (item: T, filterText: string) => boolean;
}

export interface ListState<T> {
  items: T[];
  selectedKeys: CollectionSelection;
  filterText: string;
}

export interface ListData<T> {
  /** The items in the list, with the current filter applied. */
  items: ComputedRef<T[]>;
  /** The keys of the currently selected items. */
  selectedKeys: ComputedRef<CollectionSelection>;
  /** The current filter text. */
  filterText: ComputedRef<string>;
  setSelectedKeys: (keys: CollectionSelection) => void;
  addKeysToSelection: (keys: CollectionSelection) => void;
  removeKeysFromSelection: (keys: CollectionSelection) => void;
  setFilterText: (filterText: string) => void;
  getItem: (key: CollectionKey) => T | undefined;
  insert: (index: number, ...values: T[]) => void;
  insertBefore: (key: CollectionKey, ...values: T[]) => void;
  insertAfter: (key: CollectionKey, ...values: T[]) => void;
  append: (...values: T[]) => void;
  prepend: (...values: T[]) => void;
  remove: (...keys: CollectionKey[]) => void;
  removeSelectedItems: () => void;
  move: (key: CollectionKey, toIndex: number) => void;
  moveBefore: (key: CollectionKey, keys: Iterable<CollectionKey>) => void;
  moveAfter: (key: CollectionKey, keys: Iterable<CollectionKey>) => void;
  update: (key: CollectionKey, newValue: T | ((prev: T) => T)) => void;
}

const insertAt = <T>(state: ListState<T>, index: number, ...values: T[]): ListState<T> => ({
  ...state,
  items: [...state.items.slice(0, index), ...values, ...state.items.slice(index)],
});

/**
 * Move several items to a single destination, one splice at a time.
 *
 * Copied rather than re-derived: the index bookkeeping is what makes a multi-item move land
 * where the caller meant, and it is easy to get subtly wrong in either direction.
 */
const moveItems = <T>(state: ListState<T>, indices: number[], toIndex: number): ListState<T> => {
  // Shift the target down by the number of items being moved from before the target.
  let target = toIndex - indices.filter((index) => index < toIndex).length;

  const moves = indices.map((from) => ({ from, to: target++ }));

  // Shift later `from` indices down if they have a larger index.
  for (let i = 0; i < moves.length; i += 1) {
    const a = moves[i]!;

    for (let j = i; j < moves.length; j += 1) {
      const b = moves[j]!;

      if (b.from > a.from) b.from -= 1;
    }
  }

  // Interleave the moves so they can be applied one by one rather than all at once.
  for (let i = 0; i < moves.length; i += 1) {
    const a = moves[i]!;

    for (let j = moves.length - 1; j > i; j -= 1) {
      const b = moves[j]!;

      if (b.from < a.to) a.to += 1;
      else b.from += 1;
    }
  }

  const copy = state.items.slice();

  for (const item of moves) {
    const [moved] = copy.splice(item.from, 1);

    if (moved !== undefined) copy.splice(item.to, 0, moved);
  }

  return { ...state, items: copy };
};

/**
 * State for an immutable list, with the convenience methods to update it over time — the Vue
 * counterpart of React Stately's `useListData`.
 *
 * Items and filter text are kept together so the unfiltered list is never lost: filtering is a
 * view over `items`, not a destructive edit.
 */
export const useListData = <T>(options: UseListDataOptions<T> = {}): ListData<T> => {
  const {
    filter,
    getKey = (item: any) => item.id ?? item.key,
    initialFilterText = "",
    initialItems = [],
    initialSelectedKeys,
  } = options;

  const state = shallowRef<ListState<T>>({
    filterText: initialFilterText,
    items: initialItems,
    selectedKeys: initialSelectedKeys === "all" ? "all" : new Set(initialSelectedKeys ?? []),
  });

  const dispatch = (updater: (state: ListState<T>) => ListState<T>) => {
    state.value = updater(state.value);
  };

  const indexOf = (key: CollectionKey) =>
    state.value.items.findIndex((item) => getKey(item) === key);

  /** Insert at the index of `key`, or at the front when the list is still empty. */
  const insertAtKey = (key: CollectionKey, offset: 0 | 1, values: T[]) => {
    dispatch((current) => {
      let index = current.items.findIndex((item) => getKey(item) === key);

      if (index === -1) {
        if (current.items.length > 0) return current;
        index = 0;
      }

      return insertAt(current, index + offset, ...values);
    });
  };

  const indicesOf = (keys: Iterable<CollectionKey>, items: T[]) =>
    [...keys]
      .map((key) => items.findIndex((item) => getKey(item) === key))
      // Sorted so the moved items keep their order relative to each other.
      .sort((a, b) => a - b);

  return {
    addKeysToSelection: (keys) => {
      dispatch((current) => {
        if (current.selectedKeys === "all") return current;
        if (keys === "all") return { ...current, selectedKeys: "all" };

        return { ...current, selectedKeys: new Set([...current.selectedKeys, ...keys]) };
      });
    },
    append: (...values) =>
      dispatch((current) => insertAt(current, current.items.length, ...values)),
    filterText: computed(() => state.value.filterText),
    getItem: (key) => state.value.items.find((item) => getKey(item) === key),
    insert: (index, ...values) => dispatch((current) => insertAt(current, index, ...values)),
    insertAfter: (key, ...values) => insertAtKey(key, 1, values),
    insertBefore: (key, ...values) => insertAtKey(key, 0, values),
    items: computed(() => {
      const { filterText, items } = state.value;

      return filter ? items.filter((item) => filter(item, filterText)) : items;
    }),
    move: (key, toIndex) => {
      dispatch((current) => {
        const index = current.items.findIndex((item) => getKey(item) === key);

        if (index === -1) return current;

        const copy = current.items.slice();
        const [item] = copy.splice(index, 1);

        if (item !== undefined) copy.splice(toIndex, 0, item);

        return { ...current, items: copy };
      });
    },
    moveAfter: (key, keys) => {
      dispatch((current) => {
        const toIndex = current.items.findIndex((item) => getKey(item) === key);

        if (toIndex === -1) return current;

        return moveItems(current, indicesOf(keys, current.items), toIndex + 1);
      });
    },
    moveBefore: (key, keys) => {
      dispatch((current) => {
        const toIndex = current.items.findIndex((item) => getKey(item) === key);

        if (toIndex === -1) return current;

        return moveItems(current, indicesOf(keys, current.items), toIndex);
      });
    },
    prepend: (...values) => dispatch((current) => insertAt(current, 0, ...values)),
    remove: (...keys) => {
      dispatch((current) => {
        const removed = new Set(keys);
        const items = current.items.filter((item) => !removed.has(getKey(item)));

        let selectedKeys: CollectionSelection = current.selectedKeys;

        if (selectedKeys !== "all") {
          const next = new Set(selectedKeys);

          for (const key of keys) next.delete(key);
          selectedKeys = next;
        }

        // Emptying the list drops the selection entirely, including an "all" that would
        // otherwise keep claiming everything about nothing.
        if (items.length === 0) selectedKeys = new Set();

        return { ...current, items, selectedKeys };
      });
    },
    removeKeysFromSelection: (keys) => {
      dispatch((current) => {
        if (keys === "all") return { ...current, selectedKeys: new Set() };

        const selectedKeys =
          current.selectedKeys === "all"
            ? new Set(current.items.map(getKey))
            : new Set(current.selectedKeys);

        for (const key of keys) selectedKeys.delete(key);

        return { ...current, selectedKeys };
      });
    },
    removeSelectedItems: () => {
      dispatch((current) => {
        if (current.selectedKeys === "all") {
          return { ...current, items: [], selectedKeys: new Set() };
        }

        const { selectedKeys } = current;
        const items = current.items.filter((item) => !selectedKeys.has(getKey(item)));

        return { ...current, items, selectedKeys: new Set() };
      });
    },
    selectedKeys: computed(() => state.value.selectedKeys),
    setFilterText: (filterText) => dispatch((current) => ({ ...current, filterText })),
    setSelectedKeys: (selectedKeys) => dispatch((current) => ({ ...current, selectedKeys })),
    update: (key, newValue) => {
      dispatch((current) => {
        const index = indexOf(key);

        if (index === -1) return current;

        const item = current.items[index];

        if (item === undefined) return current;

        const updated =
          typeof newValue === "function" ? (newValue as (prev: T) => T)(item) : newValue;

        return {
          ...current,
          items: [...current.items.slice(0, index), updated, ...current.items.slice(index + 1)],
        };
      });
    },
  };
};
