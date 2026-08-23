import type { CollectionKey } from "./use-collection";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue, watch } from "vue";

/** A column width: pixels as a number, a percentage of the table, or a fraction of what is left. */
export type TableColumnSize = number | string;

export interface TableColumnDefinition {
  key: CollectionKey;
  /** A width the caller controls. Set, it is never changed by a resize. */
  width?: TableColumnSize | null;
  /** The width the column starts at, when the caller is not controlling it. */
  defaultWidth?: TableColumnSize | null;
  minWidth?: TableColumnSize | null;
  maxWidth?: TableColumnSize | null;
}

/** Pixels and percentages are fixed; `fr` units and anything unrecognised flex. */
export const isStaticWidth = (width?: TableColumnSize | null): boolean =>
  width != null && (!isNaN(width as number) || /^(\d+)(?=%$)/.test(String(width)));

/** The number in front of `fr`. Anything else counts as `1fr`, as React Aria has it. */
export const parseFractionalUnit = (width?: TableColumnSize | null): number => {
  if (!width || typeof width === "number") return 1;

  const match = /^(.+)(?=fr$)/.exec(width);

  return match ? parseFloat(match[0]) : 1;
};

export const parseStaticWidth = (width: TableColumnSize, tableWidth: number): number => {
  if (typeof width === "number") return width;

  const match = /^(\d+)(?=%$)/.exec(width);

  if (!match) {
    throw new Error("Only percentages or numbers are supported for static column widths");
  }

  return tableWidth * (parseFloat(match[0]) / 100);
};

export const getMaxWidth = (
  maxWidth: TableColumnSize | null | undefined,
  tableWidth: number,
): number => (maxWidth != null ? parseStaticWidth(maxWidth, tableWidth) : Number.MAX_SAFE_INTEGER);

/**
 * A minimum cannot be given in `fr`: knowing what a fraction comes to would need every other
 * column's width, which is the very thing being solved for.
 */
export const getMinWidth = (
  minWidth: TableColumnSize | null | undefined,
  tableWidth: number,
): number => (minWidth != null ? parseStaticWidth(minWidth, tableWidth) : 0);

interface FlexItem {
  frozen: boolean;
  baseSize: number;
  hypotheticalMainSize: number;
  min: number;
  max: number;
  flex: number;
  targetMainSize: number;
  violation: number;
}

/**
 * Round an array of floats that sums to an integer, keeping the sum.
 *
 * Each column has to come out a whole number of pixels, and rounding them one by one would drift:
 * the remainder is carried forward instead, so the total is preserved.
 */
const cascadeRounding = (items: FlexItem[]): number[] => {
  let floatTotal = 0;
  let intTotal = 0;

  return items.map((item) => {
    const rounded = Math.round(item.targetMainSize + floatTotal) - intTotal;

    floatTotal += item.targetMainSize;
    intTotal += rounded;

    return rounded;
  });
};

/**
 * Column widths for one table width, ported from react-stately's `calculateColumnSizes`.
 *
 * This is the CSS flexbox layout algorithm, cut down to the shape a table needs: one row, a flex
 * basis of zero unless the column asked for a static width, and grow and shrink both equal to the
 * column's `fr`. It is deliberately **not** plain pixel sizing — `1fr` columns have to share what
 * the static and percentage columns leave over, and a minimum or maximum on any one of them
 * redistributes the rest.
 */
export const calculateColumnSizes = (
  availableWidth: number,
  columns: TableColumnDefinition[],
  changedColumns: Map<CollectionKey, TableColumnSize>,
  getDefaultWidth?: (index: number) => TableColumnSize | null | undefined,
  getDefaultMinWidth?: (index: number) => TableColumnSize | null | undefined,
): number[] => {
  const originalWidth = availableWidth;
  const flooredWidth = Math.floor(availableWidth);
  const hasFractionalWidth = availableWidth - flooredWidth > 0;

  availableWidth = flooredWidth;

  let hasNonFrozenItems = false;

  const items: FlexItem[] = columns.map((column, index) => {
    const width = (changedColumns.get(column.key) ??
      column.width ??
      column.defaultWidth ??
      getDefaultWidth?.(index) ??
      "1fr") as TableColumnSize;

    let frozen = false;
    let baseSize = 0;
    let flex = 0;
    let targetMainSize = 0;

    if (isStaticWidth(width)) {
      baseSize = parseStaticWidth(width, availableWidth);
      frozen = true;
    } else {
      flex = parseFractionalUnit(width);
      if (flex <= 0) frozen = true;
    }

    const min = getMinWidth(column.minWidth ?? getDefaultMinWidth?.(index) ?? 0, availableWidth);
    const max = getMaxWidth(column.maxWidth, availableWidth);
    const hypotheticalMainSize = Math.max(min, Math.min(baseSize, max));

    if (frozen) {
      targetMainSize = hypotheticalMainSize;
    } else if (baseSize > hypotheticalMainSize) {
      frozen = true;
      targetMainSize = hypotheticalMainSize;
    }

    if (!frozen) hasNonFrozenItems = true;

    return { baseSize, flex, frozen, hypotheticalMainSize, max, min, targetMainSize, violation: 0 };
  });

  while (hasNonFrozenItems) {
    let usedWidth = 0;
    let flexFactors = 0;

    for (const item of items) {
      if (item.frozen) {
        usedWidth += item.targetMainSize;
      } else {
        usedWidth += item.baseSize;
        flexFactors += item.flex;
      }
    }

    const remainingFreeSpace = availableWidth - usedWidth;

    // Grow mode only: each unfrozen column takes the share of what is left that its `fr` earns.
    if (remainingFreeSpace > 0) {
      for (const item of items) {
        if (!item.frozen) {
          item.targetMainSize = item.baseSize + (item.flex / flexFactors) * remainingFreeSpace;
        }
      }
    }

    let totalViolation = 0;

    for (const item of items) {
      item.violation = 0;
      if (item.frozen) continue;

      const unclamped = item.targetMainSize;

      item.targetMainSize = Math.max(item.min, Math.min(unclamped, item.max));
      item.violation = item.targetMainSize - unclamped;
      totalViolation += item.violation;
    }

    // Freeze whatever was clamped in the direction the total went, then share out what is left
    // again over the columns still free. Nothing clamped means everything is settled.
    hasNonFrozenItems = false;
    for (const item of items) {
      if (totalViolation === 0 || Math.sign(totalViolation) === Math.sign(item.violation)) {
        item.frozen = true;
      } else if (!item.frozen) {
        hasNonFrozenItems = true;
      }
    }
  }

  const sizes = cascadeRounding(items);

  // The sub-pixel remainder goes to the last column, so the columns sum to the real table width
  // rather than to the floor of it.
  if (hasFractionalWidth && sizes.length > 0) {
    const fraction = originalWidth.toString().split(".")[1];

    sizes[sizes.length - 1] = Number(`${sizes.at(-1)}.${fraction}`);
  }

  return sizes;
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
        getMinWidth(column.minWidth ?? getDefaultMinWidth(column), tableWidth),
      );
      maxWidths.set(column.key, getMaxWidth(column.maxWidth, tableWidth));
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
