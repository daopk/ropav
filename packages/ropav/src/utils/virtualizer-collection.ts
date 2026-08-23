import type {
  VirtualizerCollection,
  VirtualizerNode,
  VirtualizerNodeType,
} from "./virtualizer-layout";
import type { VirtualizerKey } from "./virtualizer-layout-info";

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
    const candidate =
      (item as { id?: unknown; key?: unknown }).id ?? (item as { key?: unknown }).key;

    if (typeof candidate === "string" || typeof candidate === "number") return candidate;
  }

  return index;
};

/** A flat collection of sibling nodes, which is what a list or a table body is. */
export const createListCollection = <T>(
  options: CreateListCollectionOptions<T>,
): VirtualizerCollection => {
  const { getKey = defaultItemKey, getTextValue, isDisabled, items, type = "item" } = options;

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

export interface VirtualizerTableCollection extends VirtualizerCollection {
  /** The key of the `header` node, which the table's own header looks its geometry up by. */
  headerKey: VirtualizerKey;
  /** The key of the single `headerrow` node the columns are laid out inside. */
  headerRowKey: VirtualizerKey;
  /** The key of the `rowgroup` node the rows are laid out inside. */
  bodyKey: VirtualizerKey;
  /** The key of the `loader` node, or `null` when the table has no loading sentinel. */
  loaderKey: VirtualizerKey | null;
  /** The columns, in order. A cell's position among them is what pairs it with a width. */
  columnKeys: VirtualizerKey[];
  /** The key of the cell where a row and a column meet. */
  cellKey: (rowKey: VirtualizerKey, columnKey: VirtualizerKey) => VirtualizerKey;
  /**
   * The same nodes seen as a flat list of rows.
   *
   * This is what `useCollection` takes as its source: selection, arrow navigation and typeahead
   * are one-dimensional, and handing them the whole table would have them walking over the header
   * and every cell. The loader is not one of these either — nothing navigates onto a sentinel.
   */
  rows: VirtualizerCollection;
}

export interface CreateTableCollectionOptions<T> {
  items: readonly T[];
  /** The columns that are rendered, in order. */
  columnKeys: readonly VirtualizerKey[];
  /** Defaults to the item's own `id`, then `key`, then its index. */
  getKey?: (item: T, index: number) => VirtualizerKey;
  /** Text a row is matched on by typeahead, for rows that have not rendered. */
  getTextValue?: (item: T) => string | undefined;
  isDisabled?: (item: T) => boolean;
  /** Whether a loading sentinel sits after the last row. */
  hasLoader?: boolean;
  /**
   * Prefix for the keys of the nodes a table has but the data never names — the header, its row,
   * the body and the loader. Pass something scoped to the table, so two tables on a page cannot
   * describe each other's geometry.
   */
  idPrefix: string;
}

/**
 * The two-dimensional collection a table layout walks: a header holding one row of columns, and a
 * body holding a row per item with a cell per column.
 *
 * React Aria gets this shape from its hidden render pass, where every cell a row rendered is a
 * node of the collection. There is no such pass here, so the cells are **derived**: a virtualized
 * table renders one cell per column, so the cell where row `r` meets column `c` is known without
 * anyone having rendered it. That is what lets the layout place a row that is nowhere in the DOM.
 *
 * Consequently a `colSpan` is not expressible — every cell is exactly one column wide.
 */
export const createTableCollection = <T>(
  options: CreateTableCollectionOptions<T>,
): VirtualizerTableCollection => {
  const {
    columnKeys: columns,
    getKey = defaultItemKey,
    getTextValue,
    hasLoader,
    idPrefix,
    isDisabled,
    items,
  } = options;

  const headerKey = `${idPrefix}-header`;
  const headerRowKey = `${idPrefix}-headerrow`;
  const bodyKey = `${idPrefix}-body`;
  const loaderKey = hasLoader ? `${idPrefix}-loader` : null;
  const cellKey = (rowKey: VirtualizerKey, columnKey: VirtualizerKey) => `${rowKey}:${columnKey}`;

  const columnKeys = [...columns];
  const rowKeys: VirtualizerKey[] = [];
  const bodyChildKeys: VirtualizerKey[] = [];

  const nodes = new Map<VirtualizerKey, VirtualizerNode>();
  const keys: VirtualizerKey[] = [];

  const add = (node: VirtualizerNode) => {
    nodes.set(node.key, node);
    keys.push(node.key);
  };

  add({ childKeys: [headerRowKey], index: 0, key: headerKey, parentKey: null, type: "header" });
  add({
    childKeys: columnKeys,
    index: 0,
    key: headerRowKey,
    parentKey: headerKey,
    type: "headerrow",
  });

  columnKeys.forEach((key, index) => {
    add({ childKeys: [], index, key, parentKey: headerRowKey, type: "column" });
  });

  // Added before its children so the keys read in document order; `bodyChildKeys` is filled below
  // and the node holds the same array.
  add({ childKeys: bodyChildKeys, index: 1, key: bodyKey, parentKey: null, type: "rowgroup" });

  items.forEach((item, index) => {
    const rowKey = getKey(item, index);
    const cellKeys = columnKeys.map((columnKey) => cellKey(rowKey, columnKey));

    rowKeys.push(rowKey);
    bodyChildKeys.push(rowKey);
    add({
      childKeys: cellKeys,
      content: item,
      index,
      isDisabled: isDisabled?.(item) ?? false,
      key: rowKey,
      parentKey: bodyKey,
      textValue: getTextValue?.(item),
      type: "row",
    });

    // A cell's index is its column's, which is what pairs it with a width. Built eagerly rather
    // than on demand: the layout asks for a row's children whenever it places that row, so a lazy
    // pass would only move the same work behind a cache.
    cellKeys.forEach((key, columnIndex) => {
      add({ childKeys: [], index: columnIndex, key, parentKey: rowKey, type: "cell" });
    });
  });

  if (loaderKey != null) {
    bodyChildKeys.push(loaderKey);
    add({ childKeys: [], index: items.length, key: loaderKey, parentKey: bodyKey, type: "loader" });
  }

  const getNode = (key: VirtualizerKey) => nodes.get(key);

  const getChildNodes = (key: VirtualizerKey) =>
    (nodes.get(key)?.childKeys ?? [])
      .map((childKey) => nodes.get(childKey))
      .filter((node): node is VirtualizerNode => node != null);

  return {
    bodyKey,
    cellKey,
    columnKeys,
    getChildNodes,
    getNode,
    headerKey,
    headerRowKey,
    // The rows alone: this is what `aria-rowcount` reports and what an empty body is decided by.
    itemCount: items.length,
    keys,
    loaderKey,
    rootKeys: [headerKey, bodyKey],
    rows: {
      getChildNodes: () => [],
      getNode,
      itemCount: items.length,
      keys: rowKeys,
      rootKeys: rowKeys,
    },
  };
};
