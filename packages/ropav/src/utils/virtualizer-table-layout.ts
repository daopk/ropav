import type { ItemDropTarget } from "./dnd-types";
import type { VirtualizerTableCollection } from "./virtualizer-collection";
import type { InvalidationContext, VirtualizerNode } from "./virtualizer-layout";
import type { VirtualizerKey } from "./virtualizer-layout-info";
import type { LayoutNode, ListLayoutOptions } from "./virtualizer-list-layout";

import { Rect, Size } from "./virtualizer-geometry";
import { LayoutInfo } from "./virtualizer-layout-info";
import { ListLayout } from "./virtualizer-list-layout";

/**
 * A table layout for the virtualizer, ported from react-stately's `TableLayout`.
 *
 * Where the list layout stacks one thing per row, this arranges six: a sticky header holding a row
 * of columns, and a body holding a row per item holding a cell per column. Everything horizontal
 * comes from `columnWidths` — the layout does not measure a column, it is told how wide one is, so
 * that the widths a browser lays a plain table out with and the widths this places cells at are
 * the same numbers.
 *
 * Departures from upstream, all deliberate:
 *
 * **No horizontal windowing.** Upstream drops cells and columns that are scrolled off to the side
 * and keeps a list of sticky indices — the selection column, and every row header column, so a row
 * keeps its accessible name — to force back the ones that must stay. A cell here is not a node
 * anyone rendered, it is a cell the caller's own row markup produced, and a row's markup cannot be
 * split across the cells the window happens to want. So every cell of a built row is placed, which
 * makes the sticky bookkeeping unnecessary rather than missing.
 *
 * **Persisted rows are recognised by key rather than by index.** Upstream keeps a map of parent to
 * child indices, rebuilt whenever the persisted set changes, and then walks it alongside the
 * visible range in three passes. Asking the virtualizer about each candidate instead gives the same
 * set in the same order, because the children are already in order.
 *
 * **The body's children are the window.** Upstream builds a region and then binary searches inside
 * it for the rows the rectangle covers, clamping to the ends when it finds none — which renders a
 * single off-screen row whenever the region and the rectangle have come apart. The index decides
 * which rows those are before any of them is placed, so there is nothing left to search and no
 * clamp to land on.
 */

/** The height React Aria falls back to when neither a fixed nor an estimated height is given. */
const DEFAULT_ROW_HEIGHT = 48;

export interface TableLayoutOptions extends ListLayoutOptions {
  /**
   * How wide each column is, in px.
   *
   * A column with no entry here is zero wide, exactly as upstream has it. The table supplies the
   * whole map, because it is the same map the non-virtualized table lays its columns out with.
   */
  columnWidths?: Map<VirtualizerKey, number>;
}

export class TableLayout<
  Options extends TableLayoutOptions = TableLayoutOptions,
> extends ListLayout<Options> {
  private columnWidths = new Map<VirtualizerKey, number>();

  protected get tableCollection(): VirtualizerTableCollection {
    return this.host!.collection as VirtualizerTableCollection;
  }

  override shouldInvalidateLayoutOptions(newOptions: Options, oldOptions: Options): boolean {
    return (
      newOptions?.columnWidths !== oldOptions?.columnWidths ||
      super.shouldInvalidateLayoutOptions(newOptions, oldOptions)
    );
  }

  override update(context: InvalidationContext<Options>): void {
    const widths = context.layoutOptions?.columnWidths;

    // A width that moved shifts every cell to its right, so nothing cached survives it. Compared
    // entry by entry rather than by identity: the map is rebuilt whenever the columns or the
    // container change, and most of those rebuilds come out the same. Upstream misses a column
    // that was **removed**, which the size check here catches.
    if (widths && (widths.size !== this.columnWidths.size || this.widthsChanged(widths))) {
      this.columnWidths = widths;
      context.sizeChanged = true;
    }

    super.update(context);
  }

  private widthsChanged(widths: Map<VirtualizerKey, number>): boolean {
    for (const [key, width] of widths) {
      if (this.columnWidths.get(key) !== width) return true;
    }

    return false;
  }

  /**
   * Every layout info to render, parents before children.
   *
   * Everything a pass built is reported. The body's children *are* the window — the index decided
   * which rows those were before any of them was placed — so there is nothing left to search over
   * and nothing to clamp against.
   */
  override getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    this.layoutFor(this.snapVisibleRect(rect));

    return this.getRenderedLayoutInfos();
  }

  protected override getRenderedLayoutInfos(): LayoutInfo[] {
    const result: LayoutInfo[] = [];

    for (const node of this.rootNodes) {
      result.push(node.layoutInfo);
      this.addVisibleLayoutInfos(result, node);
    }

    return result;
  }

  private addVisibleLayoutInfos(result: LayoutInfo[], node: LayoutNode): void {
    for (const child of node.children) {
      result.push(child.layoutInfo);
      this.addVisibleLayoutInfos(result, child);
    }
  }

  protected getEstimatedRowHeight(): number {
    return this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_HEIGHT;
  }

  protected override buildCollection(): LayoutNode[] {
    const collection = this.tableCollection;
    const nodes: LayoutNode[] = [];

    let y = 0;
    let width = 0;

    for (const key of collection.rootKeys) {
      const node = collection.getNode(key);

      if (!node) continue;

      // The header is built first, and has to be: a row takes its width from the header's, which
      // is the only thing that knows how wide every column together comes to.
      if (node.type === "header") {
        const header = this.buildTableHeader();

        y = header.layoutInfo.rect.maxY + this.gap;
        width = Math.max(width, header.layoutInfo.rect.width);
        this.layoutNodes.set(header.layoutInfo.key, header);
        nodes.push(header);
      } else if (node.type === "rowgroup") {
        const body = this.buildRowGroup(y, node);

        y = body.layoutInfo.rect.maxY + this.gap;
        width = Math.max(width, body.layoutInfo.rect.width);
        this.layoutNodes.set(body.layoutInfo.key, body);
        nodes.push(body);
      }
    }

    // The gap only sits *between* the sections, so the one added after the last is taken back.
    if (y > 0) y -= this.gap;

    // The header and the body are as wide as the wider of the two, so a body narrower than its
    // own header does not leave the header's right edge hanging over nothing.
    for (const node of nodes) node.layoutInfo.rect.width = width;

    this.contentSize = new Size(width + this.padding * 2, y + this.padding);

    return nodes;
  }

  protected buildTableHeader(): LayoutNode {
    const collection = this.tableCollection;
    const rect = new Rect(this.padding, this.padding, 0, 0);
    const layoutInfo = new LayoutInfo("header", collection.headerKey, rect);

    // The header stays put while the rows scroll under it, and sits above them while it does.
    layoutInfo.isSticky = true;
    layoutInfo.zIndex = 1;

    const children: LayoutNode[] = [];

    let y = this.padding;
    let width = 0;

    for (const headerRow of collection.getChildNodes(collection.headerKey)) {
      const child = this.buildChild(headerRow, this.padding, y, layoutInfo.key);

      child.layoutInfo.parentKey = layoutInfo.key;
      child.index = children.length;
      y = child.layoutInfo.rect.maxY;
      width = Math.max(width, child.layoutInfo.rect.width);
      children.push(child);
    }

    rect.width = width;
    rect.height = y - this.padding;

    return {
      children,
      layoutInfo,
      node: collection.getNode(collection.headerKey),
    };
  }

  protected buildHeaderRow(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const rect = new Rect(x, y, 0, 0);
    const layoutInfo = new LayoutInfo("headerrow", node.key, rect);
    const columns: LayoutNode[] = [];

    let height = 0;

    for (const column of this.tableCollection.getChildNodes(node.key)) {
      const child = this.buildChild(column, x, y, layoutInfo.key);

      child.layoutInfo.parentKey = layoutInfo.key;
      child.index = columns.length;
      x = child.layoutInfo.rect.maxX;
      height = Math.max(height, child.layoutInfo.rect.height);
      columns.push(child);
    }

    // Descending, so a column overlaps the one to its right rather than being overlapped by it —
    // which is what keeps a resizer's hit area on the edge between two columns reachable.
    for (const [index, column] of columns.entries()) {
      column.layoutInfo.zIndex = columns.length - index + 1;
    }

    this.setChildHeights(columns, height);

    rect.height = height;
    rect.width = x - rect.x;

    return { children: columns, layoutInfo, node };
  }

  protected buildColumn(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const width = this.getRenderedColumnWidth(node);
    const { height, isEstimated } = this.getEstimatedHeight(
      node,
      width,
      this.headingSize ?? this.rowSize,
      this.estimatedHeadingSize ?? this.estimatedRowSize,
    );
    const layoutInfo = new LayoutInfo(node.type, node.key, new Rect(x, y, width, height));

    layoutInfo.zIndex = 1;
    layoutInfo.estimatedSize = isEstimated;

    return { children: [], layoutInfo, node };
  }

  /**
   * How many things the body places: a row per item, and the sentinel after them.
   *
   * The sentinel is one of them rather than a special case bolted on after, so the index knows
   * where it sits and the rows around it do not have to be walked to find out.
   */
  protected override get placedCount(): number {
    const collection = this.tableCollection;

    return collection.rows.keys.length + (collection.loaderKey == null ? 0 : 1);
  }

  /**
   * Where the index puts a body child.
   *
   * A row is not a root here — the body is — so what the index places is a child of the body, and
   * the offset it gives is what lets a row nobody scrolled to be placed on its own. Pressing End
   * asks for exactly that.
   */
  protected override indexedOffset(node: VirtualizerNode): number | null {
    if (node.parentKey !== this.tableCollection.bodyKey) return null;

    return this.offsets.startOf(node.index);
  }

  /**
   * Hands a measurement to the index, or to the row that owns it.
   *
   * A cell's measurement is not a row's: a row is as tall as its **tallest** cell, so a cell that
   * measured means the row has to be built again from all of them. `buildRow` is what works the
   * height out, and what tells the index.
   */
  protected override recordMeasuredSize(layoutNode: LayoutNode, height: number): void {
    const node = layoutNode.node;

    if (!node) return;

    if (node.type === "cell") {
      if (node.parentKey != null) this.layoutNodes.delete(node.parentKey);

      return;
    }

    if (node.parentKey === this.tableCollection.bodyKey) {
      this.offsets.measure(node.key, height, node.index);
    }
  }

  /** The key of the body child at `index`, which is a row until it is the sentinel. */
  private bodyChildKey(index: number): VirtualizerKey | null {
    const collection = this.tableCollection;
    const rowKeys = collection.rows.keys;

    return index < rowKeys.length ? rowKeys[index]! : collection.loaderKey;
  }

  protected override estimatedSizeAt(index: number): number {
    if (index >= this.tableCollection.rows.keys.length) {
      return this.loaderSize ?? this.getEstimatedRowHeight();
    }

    return this.getEstimatedRowHeight();
  }

  protected override configureOffsets(start: number = this.padding): void {
    this.offsets.configure({
      collection: this.tableCollection,
      count: this.placedCount,
      estimate: (index) => this.estimatedSizeAt(index),
      gap: this.gap,
      keyAt: (index) => this.bodyChildKey(index) ?? index,
      start,
    });
  }

  /**
   * The body children placed wherever the window is.
   *
   * The sentinel, because one that is not in the DOM can never report that it came into view, so
   * the next page would never be asked for. A persisted row, because the roving tab stop lives on
   * it and losing its element drops focus to the document.
   */
  protected override indicesPlacedOutsideTheWindow(): Set<number> {
    const collection = this.tableCollection;
    const indices = this.persistedIndices(collection.rows.keys);

    if (collection.loaderKey != null) indices.add(collection.rows.keys.length);

    return indices;
  }

  protected buildRowGroup(y: number, node: VirtualizerNode): LayoutNode {
    const collection = this.tableCollection;
    const rect = new Rect(this.padding, y, 0, 0);
    const layoutInfo = new LayoutInfo("rowgroup", node.key, rect);
    const children: LayoutNode[] = [];
    const startY = y;

    this.configureOffsets(startY);

    let width = 0;

    for (const index of this.windowedIndices(this.window)) {
      const key = this.bodyChildKey(index);
      const child = key == null ? undefined : collection.getNode(key);

      if (!child) continue;

      const placed = this.buildChild(
        child,
        this.padding,
        this.offsets.startOf(index),
        layoutInfo.key,
      );

      placed.layoutInfo.parentKey = layoutInfo.key;
      placed.index = children.length;
      width = Math.max(width, placed.layoutInfo.rect.width);
      children.push(placed);
    }

    rect.width = width;
    // An empty body still fills the box, so the empty state has somewhere to sit. Otherwise the
    // index knows how tall the body is, rows nobody built included — which is what keeps the
    // scrollbar describing the whole collection.
    rect.height =
      collection.itemCount === 0 ? this.host!.size.height - startY : this.offsets.total() - startY;

    return { children, layoutInfo, node };
  }

  /** A row sits below the header, not at the top of the table. */
  protected override rowOffset(index: number): number {
    const header = this.layoutNodes.get(this.tableCollection.headerKey);
    const origin = header == null ? this.padding : header.layoutInfo.rect.maxY + this.gap;

    return origin + index * (this.getEstimatedRowHeight() + this.gap);
  }

  /**
   * The cells of one row, derived rather than looked up.
   *
   * A virtualized table renders one cell per column, so the cell where this row meets each column
   * is known without anyone having rendered it — and building them here rather than holding them
   * in the collection is what keeps the node count proportional to the window instead of to the
   * data. A cell that has been placed before keeps the node it was placed from, so a rebuilt row
   * does not have to measure its cells again.
   */
  private buildCellNodes(rowKey: VirtualizerKey): VirtualizerNode[] {
    const collection = this.tableCollection;

    return collection.columnKeys.map((columnKey, index) => {
      const key = collection.cellKey(rowKey, columnKey);
      const placed = this.layoutNodes.get(key)?.node;

      // A cell's index is its column's, which is what pairs it with a width — so a node kept from
      // before is only the same cell while the column has not moved.
      return placed?.index === index
        ? placed
        : { childKeys: [], index, key, parentKey: rowKey, type: "cell" as const };
    });
  }

  protected buildRow(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const rect = new Rect(x, y, 0, 0);
    const layoutInfo = new LayoutInfo("row", node.key, rect);
    const children: LayoutNode[] = [];

    let height = 0;

    for (const child of this.buildCellNodes(node.key)) {
      const cell = this.buildChild(child, x, y, layoutInfo.key);

      cell.index = children.length;
      x = cell.layoutInfo.rect.maxX;
      height = Math.max(height, cell.layoutInfo.rect.height);
      children.push(cell);
    }

    this.setChildHeights(children, height);

    rect.width = this.headerWidth();
    rect.height = height;

    // What the cells came to is the row's height, and the index is what the rows below it read to
    // know where they sit. With a declared `rowSize` there is nothing to tell it.
    if (this.rowSize == null) this.offsets.measure(node.key, height, node.index);

    return { children, layoutInfo, node };
  }

  protected buildCell(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const width = this.getRenderedColumnWidth(node);
    const { height, isEstimated } = this.getEstimatedHeight(
      node,
      width,
      this.rowSize,
      this.estimatedRowSize,
    );
    const layoutInfo = new LayoutInfo(node.type, node.key, new Rect(x, y, width, height));

    layoutInfo.zIndex = 1;
    layoutInfo.estimatedSize = isEstimated;

    return { children: [], layoutInfo, node };
  }

  protected override buildLoader(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const layoutNode = super.buildLoader(node, x, y);

    // The sentinel spans the table rather than the scroll container, the same as a row does.
    layoutNode.layoutInfo.rect.width = this.headerWidth();

    return layoutNode;
  }

  protected override buildNode(node: VirtualizerNode, x: number, y: number): LayoutNode {
    switch (node.type) {
      case "cell":
        return this.buildCell(node, x, y);
      case "column":
        return this.buildColumn(node, x, y);
      case "headerrow":
        return this.buildHeaderRow(node, x, y);
      case "item":
      case "row":
        return this.buildRow(node, x, y);
      case "loader":
        return this.buildLoader(node, x, y);
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  /** How wide the whole table is, which the header is the only part that knows. */
  private headerWidth(): number {
    return this.layoutNodes.get(this.tableCollection.headerKey)?.layoutInfo.rect.width ?? 0;
  }

  /** How wide the column a cell or a column header covers is. */
  private getRenderedColumnWidth(node: VirtualizerNode): number {
    const columnKey = this.tableCollection.columnKeys[node.index];

    return columnKey == null ? 0 : (this.columnWidths.get(columnKey) ?? 0);
  }

  /**
   * A height nobody declared.
   *
   * A part that has already been measured keeps that height. It counts as an estimate again if it
   * got narrower or wider, or if the datum behind it changed — either can reflow its content.
   */
  private getEstimatedHeight(
    node: VirtualizerNode,
    width: number,
    height: number | null,
    estimatedHeight: number | null,
  ): { height: number; isEstimated: boolean } {
    if (height != null) return { height, isEstimated: false };

    const previous = this.layoutNodes.get(node.key);

    if (!previous) return { height: estimatedHeight ?? DEFAULT_ROW_HEIGHT, isEstimated: true };

    return {
      height: previous.layoutInfo.rect.height,
      isEstimated:
        node !== previous.node ||
        width !== previous.layoutInfo.rect.width ||
        previous.layoutInfo.estimatedSize,
    };
  }

  /**
   * Level the parts of one row.
   *
   * A row is as tall as its tallest cell, and every cell in it is that tall — which is what makes
   * a border run the width of the row rather than stopping under the shortest cell.
   */
  private setChildHeights(children: LayoutNode[], height: number): void {
    for (const child of children) {
      if (child.layoutInfo.rect.height === height) continue;

      // Copied rather than mutated, so anything holding the old layout info sees it go stale.
      child.layoutInfo = child.layoutInfo.copy();
      child.layoutInfo.rect.height = height;
    }
  }

  /**
   * Only a row is somewhere a drop can land.
   *
   * The whole search inherited from the list layout is right; what differs is what it searches
   * over. A table's rendered set also holds the sticky header and its columns, which sit at an
   * offset the visible rectangle does not describe — near the top of the collection they are the
   * nearest thing to the pointer, and naming one would offer a drop into the header. Cells are
   * excluded too, though they would lose anyway: a row is reported before its own cells, and the
   * comparison keeps the first of equals.
   */
  protected override isDropCandidate(layoutInfo: LayoutInfo): boolean {
    return layoutInfo.type === "row";
  }

  /**
   * The indicator belongs to the body, not to the table.
   *
   * Every layout info in a table is positioned against its parent, and a gap between two rows
   * sits inside the same rowgroup they do. Without the parent it would be placed against the
   * table's own origin and land under the header.
   */
  override getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo {
    const layoutInfo = super.getDropTargetLayoutInfo(target);

    layoutInfo.parentKey = this.host!.collection.getNode(target.key)?.parentKey ?? null;

    return layoutInfo;
  }
}
