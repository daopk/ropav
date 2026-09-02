import type { UseCollectionReturn } from "../../composables/use-collection";
import type { DragCollection, DragKey } from "../../utils/dnd-types";

/**
 * A `DragCollection` over an ordinary flat collection.
 *
 * `useCollection` answers a different set of questions than the drag layer asks: it knows
 * document order and element identity, but nothing about parents, siblings or node types,
 * because a listbox has none. Everything a flat list needs follows from document order — the
 * previous key *is* the previous sibling — so the adapter is mostly renaming.
 *
 * A tree-shaped collection cannot use this. `Table` supplies its own, because only it knows
 * which rows are children of which.
 */
export const toDragCollection = (collection: UseCollectionReturn): DragCollection<unknown> => ({
  getItem: (key: DragKey) => {
    const item = collection.getItem(key);

    if (!item) return null;

    return {
      key,
      level: 0,
      nextKey: collection.getKeyAfter(key),
      parentKey: null,
      prevKey: collection.getKeyBefore(key),
      textValue: item.textValue(),
      type: "item",
    };
  },
  getKeyAfter: (key) => collection.getKeyAfter(key),
  getKeyBefore: (key) => collection.getKeyBefore(key),
  getKeys: () => collection.orderedKeys(),
});
