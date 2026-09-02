import type { CollectionKey, UseCollectionReturn } from "../../composables/use-collection";
import type { VirtualizerTableCollection } from "../../utils/virtualizer-collection";
import type { TableColumnSize } from "./use-table-column-layout";
import type { ComputedRef } from "vue";

import { computed, shallowRef } from "vue";

import { useCollection } from "../../composables/use-collection";
import { FOCUSABLE_SELECTOR } from "../../utils/focus";
import { createTableCollection } from "../../utils/virtualizer-collection";

/** The least a registry needs from an entry: where it sits in the document. */
export interface TableRegistryMeta {
  /** The entry's element, or `null` before it mounts and after it goes away. */
  element: () => HTMLElement | null;
}

export interface TableColumnMeta extends TableRegistryMeta {
  /** Whether cells under this column name their row. */
  isRowHeader: () => boolean;
  /** The column's own text, which is how a sort is announced by name. */
  textValue: () => string;
  /** A width the caller controls, which a resize never writes to. */
  width: () => TableColumnSize | null | undefined;
  /** The width the column starts at while the caller is not controlling it. */
  defaultWidth: () => TableColumnSize | null | undefined;
  minWidth: () => TableColumnSize | null | undefined;
  maxWidth: () => TableColumnSize | null | undefined;
}

export interface TableCellMeta extends TableRegistryMeta {
  /** Text this cell contributes to its row's text value. */
  textValue: () => string;
}

export interface TableRegistry<M extends TableRegistryMeta> {
  /** Register an entry and return the call that unregisters it. */
  register: (key: CollectionKey, meta: M) => () => void;
  getItem: (key: CollectionKey) => M | undefined;
  /** Registered keys in document order. */
  orderedKeys: ComputedRef<CollectionKey[]>;
  /** Where a key sits, or `-1` while it is not registered. */
  indexOf: (key: CollectionKey) => number;
  keyAt: (index: number) => CollectionKey | null;
  size: ComputedRef<number>;
}

/**
 * A registry of table parts that need to know **where they sit**, not just that they exist.
 *
 * This is the sibling of `useCollection`, and it differs in one deliberate way: the order is a
 * `computed` rather than a function. A column renders `aria-colindex` and a cell renders
 * `data-column-index` and its `role`, so position is read **during render** and has to be
 * reactive — unlike a listbox, where order is only ever read on a keypress.
 *
 * The cost of that choice: order is recomputed when a registration changes, so moving entries
 * that are already registered — reordering a `v-for` over columns with stable keys, which moves
 * DOM nodes without remounting anything — would leave the indices stale. Rows are safe because
 * nothing in their markup is derived from their order; sorting a table renders no index at all.
 */
export const createTableRegistry = <M extends TableRegistryMeta>(): TableRegistry<M> => {
  // A plain Map rather than `reactive`: the values are getter bundles, and wrapping them in a
  // proxy would only add identity surprises. Reactivity comes from `version` instead.
  const items = new Map<CollectionKey, M>();
  const version = shallowRef(0);

  const orderedKeys = computed(() => {
    void version.value;

    return (
      [...items.entries()]
        // A detached node makes `compareDocumentPosition` return DISCONNECTED, which leaves the
        // comparator non-transitive — enough to throw inside the engine's sort on some shapes.
        .filter(([, meta]) => meta.element()?.isConnected)
        .sort(([, a], [, b]) =>
          a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1,
        )
        .map(([key]) => key)
    );
  });

  return {
    getItem: (key) => {
      void version.value;

      return items.get(key);
    },
    indexOf: (key) => orderedKeys.value.indexOf(key),
    keyAt: (index) => orderedKeys.value[index] ?? null,
    orderedKeys,
    register: (key, meta) => {
      items.set(key, meta);
      version.value += 1;

      return () => {
        // Only drop the entry if it still points at this registration, so an entry that
        // re-registers under the same key during a move is not removed by the old cleanup.
        if (items.get(key) === meta) {
          items.delete(key);
          version.value += 1;
        }
      };
    },
    size: computed(() => {
      void version.value;

      return orderedKeys.value.length;
    }),
  };
};

/** Where a row sits in a tree, for the rows of a tree grid. */
export interface TableRowNodeMeta extends TableRegistryMeta {
  /** Depth from the body, counted from zero. */
  level: () => number;
  /** The row this one hangs off, or `null` for a top-level row. */
  parentKey: () => CollectionKey | null;
  /** Whether the row has children at all, which is what decides if it reports expansion. */
  hasChildRows: () => boolean;
}

export interface TableTree extends TableRegistry<TableRowNodeMeta> {
  /** Where the row sits among its siblings, both one-based, as a treegrid reports it. */
  position: (key: CollectionKey) => { posinset: number; setsize: number };
}

/**
 * The nesting of a tree grid's rows, held beside the row collection rather than inside it.
 *
 * The row collection stays a plain `useCollection` — that is what lets the selection manager and
 * the typeahead take it unchanged — so depth lives here. It is a `createTableRegistry` rather than
 * another `useCollection` for the same reason the columns are: `aria-posinset` and `aria-setsize`
 * are read **during render**, so the order has to be a `computed` and not a function.
 */
export const createTableTree = (): TableTree => {
  const registry = createTableRegistry<TableRowNodeMeta>();

  const siblingsOf = (parentKey: CollectionKey | null) =>
    registry.orderedKeys.value.filter(
      (key) => (registry.getItem(key)?.parentKey() ?? null) === parentKey,
    );

  return {
    ...registry,
    position: (key) => {
      const siblings = siblingsOf(registry.getItem(key)?.parentKey() ?? null);
      const index = siblings.indexOf(key);

      return { posinset: index + 1, setsize: siblings.length };
    },
  };
};

export interface TableCollectionItems {
  items: readonly unknown[];
  /** A row's key. Defaults to the item's own `id`, then `key`, then its index. */
  getKey?: (item: unknown, index: number) => CollectionKey;
  /** Text a row is matched on by typeahead, for a row that has not rendered. */
  getTextValue?: (item: unknown) => string | undefined;
}

export interface UseTableCollectionOptions {
  /**
   * The rows' data, for a virtualized table.
   *
   * Given, the rows come from the data rather than from the DOM — which is the only source that
   * knows about a row nobody has scrolled to. Absent, the registry answers as it always has.
   */
  items?: () => TableCollectionItems | null | undefined;
  /** Whether a loading sentinel follows the last row. */
  hasLoader?: () => boolean;
  /** Prefix for the keys of the nodes the data does not name. Scope it to the table. */
  idPrefix?: () => string;
}

export interface UseTableCollectionReturn {
  /** Column headers, in document order. */
  columns: TableRegistry<TableColumnMeta>;
  /**
   * Body rows. A plain `useCollection`, which is what lets the selection manager take this
   * table's rows without knowing a table is involved.
   */
  rows: UseCollectionReturn;
  /** Columns whose cells carry `role="rowheader"` and name their row. */
  rowHeaderColumnKeys: ComputedRef<Set<CollectionKey>>;
  /** How the rows nest, for a tree grid. Empty for a flat table. */
  tree: TableTree;
  /**
   * The two-dimensional collection a virtualizer's layout walks, or `null` when the table's rows
   * come from the DOM. Built here because it is built out of the columns, which are registered
   * here.
   */
  virtualized: ComputedRef<VirtualizerTableCollection> | null;
}

/**
 * The two-dimensional shape a table navigates and labels: columns across, rows down, and one
 * cell registry per row.
 *
 * React Aria builds all three by rendering the children into a hidden tree and reading the
 * result back. That is not possible here — rendering a slot is what creates its DOM — so the
 * flow is inverted the same way it is for a listbox: each part registers itself and the parent
 * asks the DOM for the order. A cell therefore learns which column it belongs to from **where
 * it sits among its siblings**, exactly as React Aria pairs the nth cell with the nth column.
 */
export const useTableCollection = (
  options: UseTableCollectionOptions = {},
): UseTableCollectionReturn => {
  const columns = createTableRegistry<TableColumnMeta>();

  const items = options.items;

  // The columns are what the header and every cell are placed against, so the collection is
  // rebuilt whenever one registers, leaves, or moves.
  const virtualized = items
    ? computed(() =>
        createTableCollection({
          columnKeys: columns.orderedKeys.value,
          getKey: items()?.getKey,
          getTextValue: items()?.getTextValue,
          hasLoader: options.hasLoader?.() ?? false,
          idPrefix: options.idPrefix?.() ?? "table",
          items: items()?.items ?? [],
        }),
      )
    : null;

  const rows = useCollection({ source: () => virtualized?.value.rows });

  return {
    columns,
    rowHeaderColumnKeys: computed(() => {
      const declared = columns.orderedKeys.value.filter((key) =>
        columns.getItem(key)?.isRowHeader(),
      );

      if (declared.length > 0) return new Set(declared);

      // Ported from react-stately's `TableCollection`: with no column asking for it, the first
      // column names the row, so a row is never left without an accessible name.
      const first = columns.orderedKeys.value[0];

      return new Set(first == null ? [] : [first]);
    }),
    rows,
    tree: createTableTree(),
    virtualized,
  };
};

/**
 * Strip whitespace out of a key before it goes into an id.
 *
 * Ported from react-aria's table `utils`. Ids built from a caller's keys end up in
 * `aria-labelledby`, which is a space-separated list — so a key with a space in it would read
 * as two references.
 */
export const normalizeIdKey = (key: CollectionKey): string =>
  typeof key === "string" ? key.replace(/\s*/g, "") : String(key);

/** The id a column header carries, and that a cell's own id is built on top of. */
export const tableColumnHeaderId = (tableId: string, columnKey: CollectionKey): string =>
  `${tableId}-${normalizeIdKey(columnKey)}`;

/** The id a row header cell carries, which is what `aria-labelledby` on the row points at. */
export const tableCellId = (
  tableId: string,
  rowKey: CollectionKey,
  columnKey: CollectionKey,
): string => `${tableId}-${normalizeIdKey(rowKey)}-${normalizeIdKey(columnKey)}`;

/**
 * Whether an event landed on a control inside a cell rather than on a part of the grid.
 *
 * React Aria never has to ask: its press hook stops propagation, so a button or a checkbox in a
 * cell never lets the row or the grid see the interaction. Nothing stops propagation here, so both
 * the row's click handler and the grid's key handler have to recognise the case themselves.
 *
 * The grid's own parts are told apart by their collection marker — a cell holding the roving tab
 * stop matches the focusable selector without being content.
 */
export const isTableCellControl = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  const control = target.closest(FOCUSABLE_SELECTOR);

  return control != null && !control.hasAttribute("data-collection");
};
