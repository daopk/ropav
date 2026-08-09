import type {
  VirtualizerCollection,
  VirtualizerNode,
  VirtualizerNodeType,
} from "./virtualizer-layout";
import type {VirtualizerKey} from "./virtualizer-layout-info";

/**
 * Building a collection out of data rather than out of the DOM.
 *
 * React Aria renders a collection's children into a hidden tree and reads the result back, so the
 * parent knows every node before the first paint. Rendering is what creates DOM here, so there is
 * no pass to read back — and a registry of the items that did render cannot answer for a
 * virtualized collection, where all but a window of them are absent. The nodes are built from the
 * data instead, which is the only source that knows about an item nobody has scrolled to yet.
 */

export interface CreateListCollectionOptions<T> {
  items: readonly T[];
  /** Defaults to the item's own `id`, then `key`, then its index. */
  getKey?: (item: T, index: number) => VirtualizerKey;
  /** Text the item is matched on by typeahead, for items that have not rendered. */
  getTextValue?: (item: T) => string | undefined;
  isDisabled?: (item: T) => boolean;
  /** The node type to build. `"item"` for a list, `"row"` for a table body. */
  type?: VirtualizerNodeType;
}

/** The key an item carries itself, matching what a caller would pass as `id`. */
export const defaultItemKey = (item: unknown, index: number): VirtualizerKey => {
  if (item && typeof item === "object") {
    const candidate = (item as {id?: unknown; key?: unknown}).id ?? (item as {key?: unknown}).key;

    if (typeof candidate === "string" || typeof candidate === "number") return candidate;
  }

  return index;
};

/** A flat collection of sibling nodes, which is what a list or a table body is. */
export const createListCollection = <T>(
  options: CreateListCollectionOptions<T>,
): VirtualizerCollection => {
  const {getKey = defaultItemKey, getTextValue, isDisabled, items, type = "item"} = options;

  const nodes = new Map<VirtualizerKey, VirtualizerNode>();
  const keys: VirtualizerKey[] = [];

  items.forEach((item, index) => {
    const key = getKey(item, index);

    keys.push(key);
    nodes.set(key, {
      childKeys: [],
      content: item,
      index,
      isDisabled: isDisabled?.(item) ?? false,
      key,
      parentKey: null,
      textValue: getTextValue?.(item),
      type,
    });
  });

  return {
    getChildNodes: () => [],
    getNode: (key) => nodes.get(key),
    itemCount: keys.length,
    keys,
    rootKeys: keys,
  };
};
