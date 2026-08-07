import type {ComputedRef} from "vue";

import {computed, shallowRef} from "vue";

export type CollectionKey = string | number;

export interface CollectionItemMeta {
  /** The item's element, or `null` before it mounts and after it goes away. */
  element: () => HTMLElement | null;
  /** Text the item is matched on by typeahead. */
  textValue: () => string;
  /** The item's own disabled state. The collection's `disabledKeys` merge in separately. */
  isDisabled: () => boolean;
}

export interface UseCollectionReturn {
  /** How many items are registered. Read during render, so it has to be reactive. */
  size: ComputedRef<number>;
  /** Registered keys in document order. */
  orderedKeys: () => CollectionKey[];
  getItem: (key: CollectionKey) => CollectionItemMeta | undefined;
  getElement: (key: CollectionKey) => HTMLElement | null;
  getFirstKey: () => CollectionKey | null;
  getLastKey: () => CollectionKey | null;
  getKeyAfter: (key: CollectionKey) => CollectionKey | null;
  getKeyBefore: (key: CollectionKey) => CollectionKey | null;
  /** Register an item and return the call that unregisters it. */
  register: (key: CollectionKey, meta: CollectionItemMeta) => () => void;
}

/**
 * The set of items a listbox, menu or tag group navigates over.
 *
 * React Aria builds this by rendering the children into a hidden tree and reading the result
 * back, so the parent knows every item before the first paint. That is not possible here:
 * rendering a slot is what creates its DOM, so there is no "render to inspect" pass. The flow
 * is inverted instead — each item registers itself, and the parent asks the DOM for the order.
 *
 * Two choices carry the weight:
 *
 * Metadata is stored as **getters**, not values, so the parent always reads an item's current
 * text and disabled state. Nothing has to re-register when a prop changes, and no
 * `MutationObserver` is needed to notice edited text.
 *
 * `orderedKeys()` is a **function rather than a computed**. A computed would have to be
 * invalidated by a counter bumped on register and unregister — but reordering items that are
 * already registered changes their document order without touching that counter, which would
 * silently break arrow navigation. Order is only ever read on an interaction (a keypress, a
 * focus change, extending a selection), never during render, so re-sorting per call is both
 * correct and cheap. `size` stays reactive because it *is* read during render.
 */
export const useCollection = (): UseCollectionReturn => {
  // A plain Map rather than `reactive`: the values are getter bundles, and wrapping them in a
  // proxy would only add identity surprises. Reactivity comes from `version` instead.
  const items = new Map<CollectionKey, CollectionItemMeta>();
  const version = shallowRef(0);

  const register = (key: CollectionKey, meta: CollectionItemMeta) => {
    items.set(key, meta);
    version.value += 1;

    return () => {
      // Only drop the entry if it still points at this registration, so an item that
      // re-registers under the same key during a move is not removed by the old cleanup.
      if (items.get(key) === meta) {
        items.delete(key);
        version.value += 1;
      }
    };
  };

  const orderedKeys = () =>
    [...items.entries()]
      // A detached node makes `compareDocumentPosition` return DISCONNECTED, which leaves the
      // comparator non-transitive — enough to throw inside the engine's sort on some shapes.
      .filter(([, meta]) => meta.element()?.isConnected)
      .sort(([, a], [, b]) =>
        a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      )
      .map(([key]) => key);

  const keyAt = (index: number): CollectionKey | null => {
    const keys = orderedKeys();

    return keys[index] ?? null;
  };

  const neighbour = (key: CollectionKey, step: -1 | 1): CollectionKey | null => {
    const keys = orderedKeys();
    const index = keys.indexOf(key);

    if (index === -1) return null;

    // Disabled items are deliberately not skipped here. That belongs to the keyboard
    // delegate, which walks these neighbours until it finds one it can land on.
    return keys[index + step] ?? null;
  };

  return {
    getElement: (key) => items.get(key)?.element() ?? null,
    getFirstKey: () => keyAt(0),
    getItem: (key) => items.get(key),
    getKeyAfter: (key) => neighbour(key, 1),
    getKeyBefore: (key) => neighbour(key, -1),
    getLastKey: () => keyAt(orderedKeys().length - 1),
    orderedKeys,
    register,
    size: computed(() => {
      // Touch `version` so the count follows registration; the Map itself is not reactive.
      void version.value;

      return items.size;
    }),
  };
};
