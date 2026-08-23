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
 * Two departures from upstream, both deliberate:
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
 * **The visible rectangle is copied before it is snapped**, where upstream writes through the
 * argument. The caller hands over a throwaway rectangle either way, so the result is the same.
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
   * The rectangle grown to whole rows.
   *
   * The table's own stride, which ignores the gap and does not compensate for how far the top edge
   * moved — the list layout does both. Kept as upstream has it, because one extra row rendered is
   * one row of difference against the React build.
   */
  protected override snapVisibleRect(rect: Rect): Rect {
    if (rect.height <= 1) return rect;

    const rowHeight = this.getEstimatedRowHeight();
    const snapped = rect.copy();

    snapped.y = Math.floor(snapped.y / rowHeight) * rowHeight;
    snapped.height = Math.ceil(snapped.height / rowHeight) * rowHeight;

    return snapped;
  }

  /**
   * Every layout info to render, parents before children.
   *
   * The rows are found by a binary search rather than by testing each one against the rectangle,
   * and the two do not agree at the edges: the search treats a row whose bottom edge is exactly the
   * rectangle's top edge as **above** the window, while an intersection test counts a shared edge
   * as an overlap. Since the rectangle is snapped to whole rows, its top edge lands on a row
   * boundary nearly always — so the difference is a whole extra row, every time. That is what makes
   * this a port and not a simplification.
   */
  override getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    const searchRect = this.snapVisibleRect(rect);

    this.layoutIfNeeded(searchRect);

    const result: LayoutInfo[] = [];

    for (const node of this.rootNodes) {
      result.push(node.layoutInfo);
      this.addVisibleLayoutInfos(result, node, searchRect);
    }

    return result;
  }

  private addVisibleLayoutInfos(result: LayoutInfo[], node: LayoutNode, rect: Rect): void {
    // A row group that built nothing is a table with nothing on screen; the search below would
    // clamp its way to a row that is not there.
    if (node.children.length === 0) return;

    if (node.layoutInfo.type === "rowgroup") {
      const first = this.binarySearch(node.children, rect.y);
      const last = this.binarySearch(node.children, rect.maxY);

      for (const [index, child] of node.children.entries()) {
        const keep =
          (index >= first && index <= last) ||
          // A sentinel is kept wherever the window is: one that is not in the DOM can never
          // report that it came into view. A persisted row is kept because the roving tab stop
          // lives on it.
          child.layoutInfo.type === "loader" ||
          this.host!.isPersistedKey(child.layoutInfo.key);

        if (!keep) continue;

        result.push(child.layoutInfo);
        this.addVisibleLayoutInfos(result, child, rect);
      }

      return;
    }

    // The header, its row, and a row: every child of these is placed, so every one is reported.
    for (const child of node.children) {
      result.push(child.layoutInfo);
      this.addVisibleLayoutInfos(result, child, rect);
    }
  }

  /**
   * The child whose band contains `y`, clamped to the ends.
   *
   * A row ending exactly on `y` counts as being before it, which is the edge rule the whole window
   * turns on.
   */
  private binarySearch(items: LayoutNode[], y: number): number {
    let low = 0;
    let high = items.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const rect = items[mid]!.layoutInfo.rect;

      if (rect.maxY <= y) low = mid + 1;
      else if (rect.y > y) high = mid - 1;
      else return mid;
    }

    return Math.max(0, Math.min(items.length - 1, low));
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
      validRect: rect,
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

    return { children: columns, layoutInfo, node, validRect: rect };
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

    return { children: [], layoutInfo, node, validRect: layoutInfo.rect };
  }

  protected buildRowGroup(y: number, node: VirtualizerNode): LayoutNode {
    const collection = this.tableCollection;
    const rect = new Rect(this.padding, y, 0, 0);
    const layoutInfo = new LayoutInfo("rowgroup", node.key, rect);
    const children: LayoutNode[] = [];
    const rowHeight = this.getEstimatedRowHeight() + this.gap;
    const startY = y;

    // Until the scroll box has been measured there is no window, so no row is inside one. Upstream
    // never reaches this: its collection is known before the first paint, so its header already
    // has a height and every row already starts below the empty rectangle. Here the columns are
    // registered from the DOM, so on the very first pass the header is nothing tall and the first
    // row sits at the origin — inside an empty rectangle, if nothing said otherwise.
    const hasWindow = this.requestedRect.area > 0;

    let width = 0;

    for (const child of collection.getChildNodes(node.key)) {
      // Rows outside the region asked about are accounted for rather than built, which is what
      // makes a thousand rows cost a screenful. A loader is always built: a sentinel that is not
      // in the DOM can never report that it came into view, so the next page is never asked for.
      if (
        (!hasWindow && child.type !== "loader") ||
        (y + rowHeight < this.requestedRect.y && !this.isValid(child, y)) ||
        (y > this.requestedRect.maxY && child.type !== "loader")
      ) {
        y += rowHeight;
        continue;
      }

      const row = this.buildChild(child, this.padding, y, layoutInfo.key);

      row.layoutInfo.parentKey = layoutInfo.key;
      row.index = children.length;
      y = row.layoutInfo.rect.maxY + this.gap;
      width = Math.max(width, row.layoutInfo.rect.width);
      children.push(row);
    }

    // An empty body still fills the box, so the empty state has somewhere to sit.
    if (collection.itemCount === 0) y = this.host!.size.height;
    else y -= this.gap;

    rect.width = width;
    rect.height = y - startY;

    return { children, layoutInfo, node, validRect: rect.intersection(this.requestedRect) };
  }

  protected buildRow(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const rect = new Rect(x, y, 0, 0);
    const layoutInfo = new LayoutInfo("row", node.key, rect);
    const children: LayoutNode[] = [];

    let height = 0;

    for (const child of this.tableCollection.getChildNodes(node.key)) {
      if (child.type !== "cell") continue;

      const cell = this.buildChild(child, x, y, layoutInfo.key);

      cell.index = children.length;
      x = cell.layoutInfo.rect.maxX;
      height = Math.max(height, cell.layoutInfo.rect.height);
      children.push(cell);
    }

    this.setChildHeights(children, height);

    rect.width = this.headerWidth();
    rect.height = height;

    return { children, layoutInfo, node, validRect: rect.intersection(this.requestedRect) };
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

    return { children: [], layoutInfo, node, validRect: layoutInfo.rect };
  }

  protected override buildLoader(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const layoutNode = super.buildLoader(node, x, y);

    // The sentinel spans the table rather than the scroll container, the same as a row does.
    layoutNode.layoutInfo.rect.width = this.headerWidth();
    layoutNode.validRect = layoutNode.layoutInfo.rect.intersection(this.requestedRect);

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
