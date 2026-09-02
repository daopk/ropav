import type { CollectionKey } from "../../composables/use-collection";
import type { FlexSize, FlexSizeDefinition } from "../../utils/flex-sizing";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue, watch } from "vue";

import { calculateFlexSizes, getMaxSize, getMinSize } from "../../utils/flex-sizing";

/**
 * A column width: pixels as a number, a percentage of the table, or a fraction of what is left.
 *
 * The one name from the sizing vocabulary this package still publishes, because
 * `TableColumnProps.width` names it.
 */
export type TableColumnSize = FlexSize;

export interface TableColumnDefinition {
  key: CollectionKey;
  /** A width the caller controls. Set, it is never changed by a resize. */
  width?: TableColumnSize | null;
  /** The width the column starts at, when the caller is not controlling it. */
  defaultWidth?: TableColumnSize | null;
  minWidth?: TableColumnSize | null;
  maxWidth?: TableColumnSize | null;
}

/**
 * Column widths for one table width.
 *
 * The sizing itself is `calculateFlexSizes`; what this adds is the table's own precedence — a
 * width changed by a resize in flight outranks the declared one — and the mapping from the
 * table's `width` vocabulary onto the solver's `size` one.
 */
export const calculateColumnSizes = (
  availableWidth: number,
  columns: TableColumnDefinition[],
  changedColumns: Map<CollectionKey, TableColumnSize>,
  getDefaultWidth?: (index: number) => TableColumnSize | null | undefined,
  getDefaultMinWidth?: (index: number) => TableColumnSize | null | undefined,
): number[] => {
  const definitions: FlexSizeDefinition[] = columns.map((column) => ({
    defaultSize: column.defaultWidth,
    maxSize: column.maxWidth,
    minSize: column.minWidth,
    size: changedColumns.get(column.key) ?? column.width,
  }));

  return calculateFlexSizes(availableWidth, definitions, getDefaultWidth, getDefaultMinWidth);
};

export interface BuildColumnWidthsOptions {
  /** @default "1fr" */
  getDefaultWidth?: (column: TableColumnDefinition) => TableColumnSize | null | undefined;
  /** @default 75 */
  getDefaultMinWidth?: (column: TableColumnDefinition) => TableColumnSize | null | undefined;
}

/**
 * Every column's width in pixels, keyed by column, ported from react-stately's
 * `TableColumnLayout.buildColumnWidths`.
 *
 * The sizing itself is `calculateColumnSizes` above; what this adds is the pair of defaults a
 * table falls back to — `1fr` for a width nobody declared, and a 75px floor — and the mapping back
 * onto keys. Both the resizable container and the virtualizer's table layout need exactly that,
 * and the two must agree: a column laid out at one width by the browser and at another by the
 * layout would put every cell in the wrong place.
 *
 * @param changedWidths Widths that override what the columns declare, as a resize in flight does.
 */
export const buildColumnWidths = (
  availableWidth: number,
  columns: TableColumnDefinition[],
  changedWidths: Map<CollectionKey, TableColumnSize> = new Map(),
  options: BuildColumnWidthsOptions = {},
): Map<CollectionKey, number> => {
  const getDefaultWidth = options.getDefaultWidth ?? (() => "1fr");
  const getDefaultMinWidth = options.getDefaultMinWidth ?? (() => 75);

  const sizes = calculateColumnSizes(
    availableWidth,
    columns,
    changedWidths,
    (index) => getDefaultWidth(columns[index]!),
    (index) => getDefaultMinWidth(columns[index]!),
  );

  return new Map(columns.map((column, index) => [column.key, sizes[index] ?? 0]));
};

export interface UseTableColumnLayoutOptions {
  /** The table's columns, in document order. */
  columns: () => TableColumnDefinition[];
  /** The width the columns are laid out against — the scrollable box, not the table element. */
  tableWidth: MaybeRefOrGetter<number>;
  /** @default "1fr" */
  getDefaultWidth?: (column: TableColumnDefinition) => TableColumnSize | null | undefined;
  /** @default 75 */
  getDefaultMinWidth?: (column: TableColumnDefinition) => TableColumnSize | null | undefined;
}

export interface UseTableColumnLayoutReturn {
  columnWidths: ComputedRef<Map<CollectionKey, number>>;
  getColumnWidth: (key: CollectionKey) => number;
  getColumnMinWidth: (key: CollectionKey) => number;
  getColumnMaxWidth: (key: CollectionKey) => number;
  /** The column being dragged, or `null` while none is. */
  resizingColumn: ComputedRef<CollectionKey | null>;
  startResize: (key: CollectionKey) => void;
  endResize: () => void;
  /** Apply a new width to one column and return every column's resulting size. */
  updateResizedColumns: (key: CollectionKey, width: number) => Map<CollectionKey, TableColumnSize>;
}

/**
 * Column widths for a resizable table, ported from react-stately's `TableColumnLayout` and
 * `useTableColumnResizeState`.
 *
 * Two things are worth knowing before changing any of it. A column whose `width` the caller set is
 * **controlled**: a resize never writes to it. And dragging one column's edge freezes every column
 * to its **left** at the pixel width it currently has, which is what stops the whole table from
 * reflowing while the pointer moves — the columns to the right keep their declared sizes and
 * absorb the difference.
 */
export const useTableColumnLayout = (
  options: UseTableColumnLayoutOptions,
): UseTableColumnLayoutReturn => {
  const getDefaultWidth = options.getDefaultWidth ?? (() => "1fr");
  const getDefaultMinWidth = options.getDefaultMinWidth ?? (() => 75);

  const resizingColumn = shallowRef<CollectionKey | null>(null);

  const uncontrolledColumns = () => options.columns().filter((column) => column.width == null);

  const initialUncontrolledWidths = () =>
    new Map<CollectionKey, TableColumnSize>(
      uncontrolledColumns().map((column) => [
        column.key,
        column.defaultWidth ?? getDefaultWidth(column) ?? "1fr",
      ]),
    );

  const uncontrolledWidths = shallowRef(initialUncontrolledWidths());

  // A column added or removed changes what the fractions divide, so the uncontrolled widths start
  // over rather than carrying pixel values from a layout that no longer exists.
  watch(
    () =>
      options
        .columns()
        .map((column) => column.key)
        .join(" "),
    () => {
      uncontrolledWidths.value = initialUncontrolledWidths();
    },
  );

  /** The declared width of every column, with the uncontrolled ones taken from state. */
  const combinedWidths = () =>
    new Map<CollectionKey, TableColumnSize>(
      options
        .columns()
        .map((column) => [
          column.key,
          uncontrolledWidths.value.get(column.key) ?? column.width ?? "1fr",
        ]),
    );

  const layout = computed(() => {
    const columns = options.columns();
    const tableWidth = toValue(options.tableWidth);
    const widths = buildColumnWidths(tableWidth, columns, combinedWidths(), {
      getDefaultMinWidth,
      getDefaultWidth,
    });

    const minWidths = new Map<CollectionKey, number>();
    const maxWidths = new Map<CollectionKey, number>();

    for (const column of columns) {
      minWidths.set(
        column.key,
        getMinSize(column.minWidth ?? getDefaultMinWidth(column), tableWidth),
      );
      maxWidths.set(column.key, getMaxSize(column.maxWidth, tableWidth));
    }

    return { maxWidths, minWidths, widths };
  });

  const getColumnWidth = (key: CollectionKey) => layout.value.widths.get(key) ?? 0;
  const getColumnMinWidth = (key: CollectionKey) => layout.value.minWidths.get(key) ?? 0;
  const getColumnMaxWidth = (key: CollectionKey) => layout.value.maxWidths.get(key) ?? 0;

  const updateResizedColumns = (key: CollectionKey, width: number) => {
    const previous = layout.value.widths;
    const declared = combinedWidths();
    const clamped = Math.max(
      getColumnMinWidth(key),
      Math.min(getColumnMaxWidth(key), Math.floor(width)),
    );

    const next = new Map<CollectionKey, TableColumnSize>();
    let freeze = true;

    for (const column of options.columns()) {
      if (column.key === key) {
        next.set(column.key, clamped);
        freeze = false;
      } else if (freeze) {
        // Everything to the left is pinned at the pixels it already occupies, so the drag only
        // moves the edge under the pointer.
        next.set(column.key, previous.get(column.key) ?? 0);
      } else {
        next.set(column.key, column.width ?? declared.get(column.key) ?? "1fr");
      }
    }

    // Only the uncontrolled columns are written back: a controlled width belongs to the caller.
    const committed = new Map<CollectionKey, TableColumnSize>();

    for (const column of uncontrolledColumns()) {
      committed.set(column.key, next.get(column.key) ?? "1fr");
    }
    committed.set(key, clamped);
    uncontrolledWidths.value = committed;

    return next;
  };

  return {
    columnWidths: computed(() => layout.value.widths),
    endResize: () => {
      resizingColumn.value = null;
    },
    getColumnMaxWidth,
    getColumnMinWidth,
    getColumnWidth,
    resizingColumn: computed(() => resizingColumn.value),
    startResize: (key) => {
      resizingColumn.value = key;
    },
    updateResizedColumns,
  };
};
