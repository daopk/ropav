import type {DragCollection, DragCollectionNode, DragKey} from "../utils/dnd-types";
import type {CollectionKey} from "./use-collection";
import type {UseTableCollectionReturn} from "./use-table-collection";

/**
 * A `DragCollection` over a table's rows.
 *
 * A tree grid needs its own rather than the flat `toDragCollection`, because the drag layer asks
 * two different questions that a flat list answers identically and a tree does not:
 *
 * - **Document order** — `getKeyAfter`/`getKeyBefore`, which descend into open rows. This is how
 *   a drag steps down the table, one visible row at a time.
 * - **Sibling order** — `prevKey`/`nextKey` on a node, which skip over a row's whole subtree.
 *   This is how the drop layer recognises two names for the same gap, and how the tree delegate
 *   finds where a subtree ends.
 *
 * A flat table has one level, so the two coincide and this behaves exactly like the listbox
 * adapter.
 */
export const toTableDragCollection = (
  collection: UseTableCollectionReturn,
): DragCollection<unknown> => {
  const {rows, tree} = collection;

  const levelOf = (key: CollectionKey) => tree.getItem(key)?.level() ?? 0;
  const parentOf = (key: CollectionKey) => tree.getItem(key)?.parentKey() ?? null;

  /** Rows sharing a parent, in document order. Empty for a table with no tree registered. */
  const siblingsOf = (parentKey: CollectionKey | null) =>
    rows.orderedKeys().filter((key) => parentOf(key) === parentKey);

  const siblingAt = (key: CollectionKey, offset: number): DragKey | null => {
    const siblings = siblingsOf(parentOf(key));
    const index = siblings.indexOf(key);

    if (index < 0) return null;

    return siblings[index + offset] ?? null;
  };

  const childrenOf = (key: CollectionKey) => siblingsOf(key);

  return {
    getItem: (key: DragKey): DragCollectionNode<unknown> | null => {
      const row = rows.getItem(key);

      if (!row) return null;

      const children = childrenOf(key);

      return {
        firstChildKey: children[0] ?? null,
        // A row that can hold children still counts as one while it is closed and empty.
        hasChildItems: tree.getItem(key)?.hasChildRows() ?? children.length > 0,
        key,
        lastChildKey: children[children.length - 1] ?? null,
        level: levelOf(key),
        nextKey: siblingAt(key, 1),
        parentKey: parentOf(key),
        prevKey: siblingAt(key, -1),
        textValue: row.textValue(),
        type: "item",
      };
    },
    getKeyAfter: (key) => rows.getKeyAfter(key),
    getKeyBefore: (key) => rows.getKeyBefore(key),
    getKeys: () => rows.orderedKeys(),
  };
};
