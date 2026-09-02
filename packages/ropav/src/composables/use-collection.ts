import type { VirtualizerCollection } from "../utils/virtualizer-layout";
import type { ComputedRef } from "vue";

import { computed, shallowRef } from "vue";

import { sortByDocumentOrder } from "../utils/document-order";

export type CollectionKey = string | number;

export interface CollectionItemMeta {
  /** The item's element, or `null` before it mounts and after it goes away. */
  element: () => HTMLElement | null;
  /** Text the item is matched on by typeahead. */
  textValue: () => string;
  /** The item's own disabled state. The collection's `disabledKeys` merge in separately. */
  isDisabled: () => boolean;
}

export interface UseCollectionOptions {
  /**
   * Where the collection's contents come from, when they do not come from the DOM.
   *
   * A virtualized collection renders only a window of its items, so the registry below can only
   * ever see that window. Given a source, order, size and metadata are read from the data, and
   * the registry is left with the one job the data cannot do: handing out the element a key
   * currently occupies.
   */
  source?: () => VirtualizerCollection | null | undefined;
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
  /** The item's position among its siblings, or `-1` when it is not in the collection. */
  getIndex: (key: CollectionKey) => number;
  /**
   * Run `operation` against a single reading of the collection's order.
   *
   * Wrap anything that walks the collection more than once — arrow navigation, paging, typeahead,
   * extending a selection. See {@link useCollection} for why this is scoped rather than cached.
   */
  withOrder: <T>(operation: () => T) => T;
  /** Register an item and return the call that unregisters it. */
  register: (key: CollectionKey, meta: CollectionItemMeta) => () => void;
}

/**
 * `key → index` for a data-backed collection, memoized on the source itself.
 *
 * A source is rebuilt whenever its data changes — it is handed over out of a `computed` — so its
 * identity is already the right cache key and nothing has to invalidate this by hand. Held weakly,
 * so a collection that has gone away takes its map with it.
 *
 * This is what keeps `getIndex` off a scan on the one path that has no operation to scope to:
 * `aria-posinset` and `aria-rowindex` are read during render, once per item, and a virtualized
 * collection's source holds every item rather than the rendered window.
 */
const sourceIndices = new WeakMap<VirtualizerCollection, Map<CollectionKey, number>>();

const indicesOf = (source: VirtualizerCollection): Map<CollectionKey, number> => {
  const cached = sourceIndices.get(source);

  if (cached) return cached;

  const indices = new Map(source.keys.map((key, index) => [key, index]));

  sourceIndices.set(source, indices);

  return indices;
};

/** One reading of the collection's order, and the positions within it. */
interface CollectionOrder {
  keys: CollectionKey[];
  /** The key's position, or `-1` when the order does not hold it. */
  indexOf: (key: CollectionKey) => number;
}

/**
 * The set of items a listbox, menu or tag group navigates over.
 *
 * React Aria builds this by rendering the children into a hidden tree and reading the result
 * back, so the parent knows every item before the first paint. That is not possible here:
 * rendering a slot is what creates its DOM, so there is no "render to inspect" pass. The flow
 * is inverted instead — each item registers itself, and the parent asks the DOM for the order.
 *
 * Three choices carry the weight:
 *
 * Metadata is stored as **getters**, not values, so the parent always reads an item's current
 * text and disabled state. Nothing has to re-register when a prop changes, and no
 * `MutationObserver` is needed to notice edited text.
 *
 * `orderedKeys()` is a **function rather than a computed**. A computed would have to be
 * invalidated by a counter bumped on register and unregister — but reordering items that are
 * already registered changes their document order without touching that counter, which would
 * silently break arrow navigation. Order is only ever read on an interaction (a keypress, a
 * focus change, extending a selection), never during render, so `size` stays reactive — because
 * it *is* read during render — while order deliberately stays outside reactivity.
 *
 * Sorting the DOM per call, however, is only cheap for a *single* read, and the callers that
 * matter walk the collection one neighbour at a time: typeahead, paging, and skipping disabled
 * items all ask for a neighbour in a loop. Sorting inside that loop is quadratic, and a search
 * that matches nothing walks the whole collection twice. {@link UseCollectionReturn.withOrder}
 * is what those callers wrap themselves in: the order is read once and every step reads that one
 * snapshot.
 *
 * The snapshot is **scoped to one synchronous operation** rather than cached across operations,
 * because caching is the very thing the second choice above rules out. Vue flushes renders on
 * `nextTick`, so the DOM cannot reorder itself in the middle of a keydown handler — which is
 * exactly as long as a snapshot is allowed to live. It must never become a `computed`.
 *
 * A collection that is virtualized cannot work that way at all: all but a window of its items are
 * absent from the DOM, so asking the DOM would answer for the window and call the rest
 * non-existent. Such a collection passes a `source`, and then order, size and metadata come from
 * the data while the registry keeps the one job the data cannot do — saying which element a key
 * currently occupies, for focus.
 */
export const useCollection = (options: UseCollectionOptions = {}): UseCollectionReturn => {
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

  const source = () => options.source?.() ?? null;

  /**
   * Metadata for an item the data knows about but the DOM does not hold yet.
   *
   * Typeahead and the disabled check are asked about every key, not only the rendered ones, so
   * an item outside the window has to answer for itself out of the data.
   */
  const metaFromSource = (key: CollectionKey): CollectionItemMeta | undefined => {
    const node = source()?.getNode(key);

    if (!node) return undefined;

    return {
      element: () => null,
      isDisabled: () => Boolean(node.isDisabled),
      textValue: () => node.textValue ?? "",
    };
  };

  const domOrderedKeys = () =>
    sortByDocumentOrder([...items.entries()], ([, meta]) => meta.element()).map(([key]) => key);

  const buildOrder = (): CollectionOrder => {
    const sourced = source();

    // Data order is the collection's order. Reading the DOM would answer for the window only,
    // and would put the first key at whatever happens to be scrolled into view.
    const keys = sourced ? sourced.keys : domOrderedKeys();

    // Built on demand, so the reads that only want a key at a position — the ends, a neighbour's
    // successor — pay nothing for it. The data path's map is memoized on the source.
    let indices = sourced ? indicesOf(sourced) : null;

    return {
      indexOf: (key) => {
        indices ??= new Map(keys.map((entry, index) => [entry, index]));

        return indices.get(key) ?? -1;
      },
      keys,
    };
  };

  /** The order this operation is reading, or a fresh reading for a call that stands alone. */
  let scoped: CollectionOrder | null = null;
  let depth = 0;

  const order = (): CollectionOrder => scoped ?? buildOrder();

  const withOrder = <T>(operation: () => T): T => {
    // Re-entrant, so a caller that wraps its own handler does not fight one of the walks inside
    // it wrapping itself. The outermost scope owns the snapshot.
    if (depth === 0) scoped = buildOrder();
    depth += 1;

    try {
      return operation();
    } finally {
      depth -= 1;
      if (depth === 0) scoped = null;
    }
  };

  const orderedKeys = (): CollectionKey[] => order().keys;

  const keyAt = (index: number): CollectionKey | null => order().keys[index] ?? null;

  const neighbour = (key: CollectionKey, step: -1 | 1): CollectionKey | null => {
    const { indexOf, keys } = order();
    const index = indexOf(key);

    if (index === -1) return null;

    // Disabled items are deliberately not skipped here. That belongs to the keyboard
    // delegate, which walks these neighbours until it finds one it can land on.
    return keys[index + step] ?? null;
  };

  /**
   * Read the registration counter, so a lookup made inside a `computed` re-runs once the item
   * it asked about registers. `getItem` and `getElement` are read during render — an item's
   * own disabled state and tabindex come from them — unlike `orderedKeys()`, which is only ever
   * read on an interaction and so deliberately stays outside reactivity.
   */
  const track = () => {
    void version.value;
  };

  return {
    getElement: (key) => {
      track();

      return items.get(key)?.element() ?? null;
    },
    getFirstKey: () => keyAt(0),
    getIndex: (key) => order().indexOf(key),
    getItem: (key) => {
      track();

      return items.get(key) ?? metaFromSource(key);
    },
    getKeyAfter: (key) => neighbour(key, 1),
    getKeyBefore: (key) => neighbour(key, -1),
    getLastKey: () => order().keys.at(-1) ?? null,
    orderedKeys,
    register,
    size: computed(() => {
      track();

      return source()?.itemCount ?? items.size;
    }),
    withOrder,
  };
};
