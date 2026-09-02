import type { CollectionKey } from "../../composables/use-collection";
import type { DragAndDropHooks } from "../../composables/use-drag-and-drop";
import type { UseDraggableCollectionStateReturn } from "../../composables/use-draggable-collection-state";
import type { UseDraggableItemReturn } from "../../composables/use-draggable-item";
import type { UseDroppableCollectionStateReturn } from "../../composables/use-droppable-collection-state";
import type { UseSelectionManagerReturn } from "../../composables/use-selection-manager";
import type { VirtualizerView } from "../../composables/use-virtualizer";
import type { ScrollToOffset } from "../../composables/use-virtualizer-scroll";
import type { VirtualizerTableCollection } from "../../utils/virtualizer-collection";
import type { Point, Size } from "../../utils/virtualizer-geometry";
import type { LayoutInfo, VirtualizerKey } from "../../utils/virtualizer-layout-info";
import type { TableSortDescriptor, TableSortDirection } from "./table.types";
import type { UseGridKeyboardReturn } from "./use-grid-keyboard";
import type {
  TableCellMeta,
  TableCollectionItems,
  TableRegistry,
  UseTableCollectionReturn,
} from "./use-table-collection";
import type { TableColumnSize, UseTableColumnLayoutReturn } from "./use-table-column-layout";
import type { tableVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface TableContext {
  slots: ComputedRef<ReturnType<typeof tableVariants>>;
}

/**
 * Strict: every part reads its class from here, so a part outside a table would render
 * unstyled markup that still claims a table role.
 */
export const [useTableContext, provideTableContext] = createContext<TableContext>({
  name: "TableContext",
});

export interface TableGridContext {
  collection: UseTableCollectionReturn;
  /** The grid's own id, which column header and row header cell ids are built from. */
  tableId: ComputedRef<string>;
  /** Shared marker so a part can tell which grid it belongs to. */
  collectionId: ComputedRef<string>;
  /** The column being sorted and its direction, or `null` while nothing is sorted. */
  sortDescriptor: ComputedRef<TableSortDescriptor | null>;
  /** Selected and focused rows. Runs on `collection.rows`, so a row key is the item key. */
  selection: UseSelectionManagerReturn;
  /** Where focus sits in the grid, and the roving tab index every part reads from it. */
  keyboard: UseGridKeyboardReturn;
  /** Ask for a sort. Without a direction, the current one flips. */
  sort: (columnKey: CollectionKey, direction?: TableSortDirection) => void;
  /** The column that carries the chevron and the indentation, or `null` for a flat table. */
  treeColumn: ComputedRef<CollectionKey | null>;
  /** Rows currently expanded. Always empty for a flat table. */
  expandedKeys: ComputedRef<Set<CollectionKey>>;
  /** Open or close a row. Does nothing outside a tree grid. */
  toggleExpanded: (rowKey: CollectionKey) => void;
  /** How many columns the rows span, which a drop indicator's single cell has to cover. */
  columnCount: ComputedRef<number>;
  /**
   * The drag and drop configuration, when there is any.
   *
   * Rows read the hooks from here rather than importing them, so a table without drag and drop
   * leaves the whole layer out of the bundle.
   */
  dragAndDropHooks?: DragAndDropHooks;
  dragState?: UseDraggableCollectionStateReturn<unknown>;
  dropState?: UseDroppableCollectionStateReturn<unknown>;
}

/**
 * Strict for the same reason: a column that cannot register has no index, so it would render
 * without the `aria-colindex` a grid is required to expose.
 */
export const [useTableGridContext, provideTableGridContext] = createContext<TableGridContext>({
  name: "TableGridContext",
});

export interface TableRowContext {
  rowKey: ComputedRef<CollectionKey>;
  /** Whether the row has children to expand, which the chevron and the cell both read. */
  hasChildRows: ComputedRef<boolean>;
  /** Whether the row is expanded. */
  isExpanded: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isSelected: ComputedRef<boolean>;
  /** Depth on the wire, counted from one, which the cells repeat. */
  level: ComputedRef<number>;
  /** Open or close this row. */
  toggle: () => void;
  /** Ids of the cells that name this row, which a selection checkbox borrows for its own name. */
  ariaLabelledBy: ComputedRef<string>;
  /** The cells of this row, which is how a cell learns which column it sits under. */
  cells: TableRegistry<TableCellMeta>;
  /**
   * The position a cell takes among its siblings until the registry has read the DOM.
   *
   * Cells set up in template order, so the count of those before it is where a cell sits — and
   * knowing it during the first render is what lets a windowed cell be placed under its column
   * the moment it mounts, rather than a tick later in a second pass over every cell of the row.
   */
  claimCellIndex: () => number;
  /**
   * What `Table.DragHandle` needs to turn a pressable into this row's drag control, or `null`
   * when the table is not draggable.
   *
   * The row itself carries the native drag; this is only the accessible path, for a keyboard or
   * a screen reader that has no drag gesture to make.
   */
  drag: UseDraggableItemReturn | null;
}

/**
 * Loose, so a part can ask **whether** it sits inside a row: the selection checkbox is the same
 * component in the header and in a row, and which of the two it is decides what it toggles.
 */
export const [useTableRowContextOptional, provideTableRowContext] =
  createContext<TableRowContext | null>({
    defaultValue: null,
    name: "TableRowContext",
    strict: false,
  });

/** The row a part is required to sit inside, for the parts that mean nothing outside one. */
export const useTableRowContext = (): TableRowContext => {
  const context = useTableRowContextOptional();

  if (!context) {
    throw new Error("`TableRowContext` was consumed outside of its provider component.");
  }

  return context;
};

export interface TableResizableContainerContext {
  /** Width the columns are laid out against: the scrollable box, not the table element. */
  tableWidth: ComputedRef<number>;
  onResizeStart: (widths: Map<CollectionKey, TableColumnSize>) => void;
  onResize: (widths: Map<CollectionKey, TableColumnSize>) => void;
  onResizeEnd: (widths: Map<CollectionKey, TableColumnSize>) => void;
}

/**
 * Loose: resizing is opt-in. A table wrapped in the plain scroll container has no width to lay
 * columns out against, and reads `null` here.
 */
export const [useTableResizableContainerContext, provideTableResizableContainerContext] =
  createContext<TableResizableContainerContext | null>({
    defaultValue: null,
    name: "TableResizableContainerContext",
    strict: false,
  });

export interface TableColumnLayoutContext extends TableResizableContainerContext {
  layout: UseTableColumnLayoutReturn;
}

/**
 * Loose for the same reason, and provided by the grid rather than the container: the layout needs
 * the collection, and only the grid has it. This mirrors React Aria, where the container carries
 * the width and the table itself builds the resize state.
 */
export const [useTableColumnLayoutContext, provideTableColumnLayoutContext] =
  createContext<TableColumnLayoutContext | null>({
    defaultValue: null,
    name: "TableColumnLayoutContext",
    strict: false,
  });

export interface TableColumnContext {
  columnKey: ComputedRef<CollectionKey>;
  /** Id of the `th`, which the resizer's own accessible name points at. */
  headerId: ComputedRef<string>;
}

/** Strict: a resizer outside a column header has no column to resize. */
export const [useTableColumnContext, provideTableColumnContext] = createContext<TableColumnContext>(
  { name: "TableColumnContext" },
);

/** The scroll box as the scrollbars a windowed table draws for itself read it. */
export interface TableScrollState {
  /** How far the box is scrolled. The inline axis runs negative in a right-to-left box. */
  offset: ComputedRef<Point>;
  /** The box's own size, which is what it shows of the content at once. */
  size: ComputedRef<Size>;
  /** The box's scrollable overflow — everything it could show. */
  scrollSize: ComputedRef<Size>;
  /** Scrolls the box from the main thread, so the rows and the offset are committed together. */
  scrollTo: (offset: ScrollToOffset) => void;
}

export interface TableVirtualizerContext {
  /**
   * The collection the layout walks. It is what names the header, the body and each cell, so a
   * part can look up the geometry that was worked out for it.
   */
  collection: ComputedRef<VirtualizerTableCollection>;
  getLayoutInfo: (key: VirtualizerKey) => LayoutInfo | null;
  /** The rows inside the window, in order. Each carries the geometry of its own wrapper. */
  rowViews: ComputedRef<VirtualizerView[]>;
  /** What gives the scroll box the height of the whole collection rather than of the window. */
  contentStyle: ComputedRef<Record<string, string | number | undefined>>;
  scroll: TableScrollState;
  /**
   * The rows' data, handed **up** from the body.
   *
   * `items` is declared on `Table.Body`, but the collection belongs to the grid:
   * it is the grid that scrolls, that the keyboard walks, and that the selection runs over. So the
   * body registers what it was given rather than owning it.
   */
  setItems: (items: TableCollectionItems | null) => void;
  /** Register that a loading sentinel is present, so the layout reserves a place for it. */
  setHasLoader: (hasLoader: boolean) => void;
}

/**
 * Loose: a table renders the same way with or without a `Virtualizer` above it, and requiring one
 * would make every table in the library carry a layout.
 */
export const [useTableVirtualizerContext, provideTableVirtualizerContext] =
  createContext<TableVirtualizerContext | null>({
    defaultValue: null,
    name: "TableVirtualizerContext",
    strict: false,
  });
