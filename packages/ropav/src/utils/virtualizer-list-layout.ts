import type { DropTarget, ItemDropTarget } from "./dnd-types";
import type {
  InvalidationContext,
  VirtualizerCollection,
  VirtualizerNode,
} from "./virtualizer-layout";
import type { VirtualizerKey } from "./virtualizer-layout-info";

import { Rect, Size } from "./virtualizer-geometry";
import { Layout } from "./virtualizer-layout";
import { LayoutInfo } from "./virtualizer-layout-info";

/**
 * A stack layout for the virtualizer, ported from React Aria's `ListLayout`.
 *
 * Items are placed one after another along the block axis, each as wide as the scroll container
 * minus the padding. With `rowSize` given the geometry is arithmetic; without it each item is
 * placed at an estimate and corrected once it has been measured.
 *
 * The layout is lazy. It computes rows for the region it has been asked about — `requestedRect` —
 * and accounts for everything outside it arithmetically, so a thousand rows cost about as much as
 * a screenful. `validRect` records how much of that region is known-good, which is what lets a
 * measured row survive the next pass instead of being placed at an estimate again.
 *
 * Where the region goes next is the one place this parts company with upstream, which unions it
 * with everywhere the window has been. Anchored at the top as it starts out, that union never
 * moves off zero — so the rows above the window are re-walked on every pass and never dropped,
 * and a collection scrolled end to end ends up holding a layout node per row. With `rowSize` the
 * region moves with the window instead and the rows it leaves behind are pruned, because a row's
 * offset is a multiplication and nothing above it is needed to work it out.
 *
 * Three things are absent, all recorded as debt: the horizontal orientation, which no collection
 * in this library uses; the `section`/`header`/`separator` node types, which cannot reach a layout
 * through the data-driven collection this build has; and the same windowing for rows of a height
 * nobody declared, which still union and still walk from the first row. Getting them off that
 * walk needs the offsets kept as a running index — heights held by key, and totals at intervals
 * to resume from — rather than re-added from the top each pass. Nothing in this library asks for
 * a variable row yet, which is why the walk is still there.
 */

/** The height React Aria falls back to when neither a fixed nor an estimated size is given. */
const DEFAULT_ROW_SIZE = 48;

export interface ListLayoutOptions {
  /** The fixed size of a row, in px. */
  rowSize?: number;
  /** The size to place a row at before it has been measured, when rows vary. */
  estimatedRowSize?: number;
  /** The fixed size of a section header, in px. */
  headingSize?: number;
  /** The size to place a section header at before it has been measured. */
  estimatedHeadingSize?: number;
  /** The fixed size of a loading sentinel, in px. */
  loaderSize?: number;
  /** The space between items, in px. */
  gap?: number;
  /** The space around the whole list, in px. */
  padding?: number;
  /** How thick the line marking a gap between two items is, in px. @default 2 */
  dropIndicatorThickness?: number;
}

/** A layout info plus the hierarchy around it, which a table needs and a list does not. */
export interface LayoutNode {
  layoutInfo: LayoutInfo;
  children: LayoutNode[];
  /** The part of the layout info that has been computed against real data. */
  validRect: Rect;
  node?: VirtualizerNode;
  index?: number;
}

export class ListLayout<
  Options extends ListLayoutOptions = ListLayoutOptions,
> extends Layout<Options> {
  protected rowSize: number | null;

  protected estimatedRowSize: number | null;

  protected headingSize: number | null;

  protected estimatedHeadingSize: number | null;

  protected loaderSize: number | null;

  protected gap: number;

  protected padding: number;

  protected dropIndicatorThickness: number;

  protected layoutNodes = new Map<VirtualizerKey, LayoutNode>();

  protected rootNodes: LayoutNode[] = [];

  protected contentSize = new Size();

  /** The region rows have been computed for. Everything outside it is only accounted for. */
  protected requestedRect = new Rect();

  /** The part of `requestedRect` whose rows are known-good. */
  protected validRect = new Rect();

  protected lastCollection: VirtualizerCollection | null = null;

  private invalidateEverything = false;

  /** Where the loaders sit among the root keys, memoized on the collection they came from. */
  private loaderIndices: number[] = [];

  private loaderIndicesCollection: VirtualizerCollection | null = null;

  constructor(options: ListLayoutOptions = {}) {
    super();
    this.rowSize = options.rowSize ?? null;
    this.estimatedRowSize = options.estimatedRowSize ?? null;
    this.headingSize = options.headingSize ?? null;
    this.estimatedHeadingSize = options.estimatedHeadingSize ?? null;
    this.loaderSize = options.loaderSize ?? null;
    this.gap = options.gap ?? 0;
    this.padding = options.padding ?? 0;
    this.dropIndicatorThickness = options.dropIndicatorThickness ?? 2;
  }

  getContentSize(): Size {
    return this.contentSize;
  }

  getLayoutInfo(key: VirtualizerKey): LayoutInfo | null {
    this.ensureLayoutInfo(key);

    return this.layoutNodes.get(key)?.layoutInfo ?? null;
  }

  /**
   * The rectangle grown to whole rows.
   *
   * Without this a one-pixel scroll would change which rows fall inside the rectangle, and the set
   * of rendered elements would churn on every frame. A table snaps differently — its own row
   * stride ignores the gap — so this is the one part of the walk a subclass replaces.
   */
  protected snapVisibleRect(rect: Rect): Rect {
    if (rect.height <= 1) return rect;

    const rowSize = (this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE) + this.gap;
    const snapped = rect.copy();

    const y = Math.floor(snapped.y / rowSize) * rowSize;
    const height = snapped.height + snapped.y - y;

    snapped.y = y;
    snapped.height = Math.ceil(height / rowSize) * rowSize;

    return snapped;
  }

  /** Every layout info inside `rect`, snapped to whole rows, parents before children. */
  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    const searchRect = this.snapVisibleRect(rect);

    this.layoutIfNeeded(searchRect);

    const result: LayoutInfo[] = [];

    const addNodes = (nodes: LayoutNode[]) => {
      for (const node of nodes) {
        if (!this.isVisible(node, searchRect)) continue;

        result.push(node.layoutInfo);
        addNodes(node.children);
      }
    };

    addNodes(this.rootNodes);

    return result;
  }

  override update(context: InvalidationContext<Options>): void {
    const collection = this.host!.collection;

    // Everything cached is worthless when the container resized or a size option changed, so the
    // requested region shrinks back to what is on screen rather than being recomputed whole.
    this.invalidateEverything = this.shouldInvalidateEverything(context);

    if (this.invalidateEverything) {
      this.requestedRect = this.host!.visibleRect.copy();
      this.layoutNodes.clear();
    }

    const options = context.layoutOptions;

    this.rowSize = options?.rowSize ?? this.rowSize;
    this.estimatedRowSize = options?.estimatedRowSize ?? this.estimatedRowSize;
    this.headingSize = options?.headingSize ?? this.headingSize;
    this.estimatedHeadingSize = options?.estimatedHeadingSize ?? this.estimatedHeadingSize;
    this.loaderSize = options?.loaderSize ?? this.loaderSize;
    this.gap = options?.gap ?? this.gap;
    this.padding = options?.padding ?? this.padding;
    this.dropIndicatorThickness = options?.dropIndicatorThickness ?? this.dropIndicatorThickness;

    this.rootNodes = this.buildCollection();

    // Walked over what is cached rather than over what the collection holds: the cache is bounded
    // by the window, while a collection is as long as its data.
    if (this.lastCollection && collection !== this.lastCollection) {
      for (const [key, layoutNode] of this.layoutNodes) {
        // A cell is derived rather than held by the collection, so it is the row that says
        // whether it is still there.
        const owner = layoutNode.layoutInfo.type === "cell" ? layoutNode.layoutInfo.parentKey : key;

        if (owner == null || !collection.getNode(owner)) this.layoutNodes.delete(key);
      }
    }

    this.lastCollection = collection;
    this.invalidateEverything = false;
    this.validRect = this.requestedRect.copy();
  }

  override shouldInvalidateLayoutOptions(newOptions: Options, oldOptions: Options): boolean {
    return (
      newOptions?.rowSize !== oldOptions?.rowSize ||
      newOptions?.estimatedRowSize !== oldOptions?.estimatedRowSize ||
      newOptions?.headingSize !== oldOptions?.headingSize ||
      newOptions?.estimatedHeadingSize !== oldOptions?.estimatedHeadingSize ||
      newOptions?.loaderSize !== oldOptions?.loaderSize ||
      newOptions?.gap !== oldOptions?.gap ||
      newOptions?.padding !== oldOptions?.padding
    );
  }

  /**
   * Records a row's measured size.
   *
   * Returns whether anything moved, which is the virtualizer's cue to lay out again. The rows
   * below this one are the ones that moved, so the valid region is cut off at this row's offset
   * rather than thrown away entirely.
   */
  override updateItemSize(key: VirtualizerKey, size: Size): boolean {
    const layoutNode = this.layoutNodes.get(key);

    if (!layoutNode) return false;

    const layoutInfo = layoutNode.layoutInfo;

    layoutInfo.estimatedSize = false;

    if (layoutInfo.rect.height === size.height) return false;

    // Copied rather than mutated, so anything holding the old layout info sees it go stale.
    const measured = layoutInfo.copy();

    measured.rect.height = size.height;
    layoutNode.layoutInfo = measured;

    this.validRect.height = Math.min(this.validRect.height, layoutInfo.rect.y - this.validRect.y);

    if (layoutNode.node?.type === "item" || layoutNode.node?.type === "row") {
      this.requestedRect.height += measured.rect.height - layoutInfo.rect.height;
    }

    this.replaceLayoutInfo(key, layoutInfo, measured);

    let parentKey = layoutInfo.parentKey;

    while (parentKey != null) {
      this.replaceLayoutInfo(parentKey, layoutInfo, measured);
      parentKey = this.layoutNodes.get(parentKey)?.layoutInfo.parentKey ?? null;
    }

    return true;
  }

  protected shouldInvalidateEverything(context: InvalidationContext<Options>): boolean {
    const options = context.layoutOptions;

    return Boolean(
      context.sizeChanged ||
      this.rowSize !== (options?.rowSize ?? this.rowSize) ||
      this.headingSize !== (options?.headingSize ?? this.headingSize) ||
      this.loaderSize !== (options?.loaderSize ?? this.loaderSize) ||
      this.gap !== (options?.gap ?? this.gap) ||
      this.padding !== (options?.padding ?? this.padding),
    );
  }

  /**
   * Whether a row's offset is a multiplication rather than a running total.
   *
   * With a fixed row size nothing in the collection can be a height other than the stride, which
   * is what lets the region move with the window instead of growing to cover everywhere it has
   * been. A loader breaks it: the sentinel is sized by its own option, so every row after it sits
   * at an offset no multiplication knows.
   */
  protected get hasArithmeticStride(): boolean {
    return this.rowSize != null && this.rootLoaderIndices().length === 0;
  }

  /** Where the loaders sit among the root keys, scanned once per collection rather than per pass. */
  private rootLoaderIndices(): number[] {
    const collection = this.host!.collection;

    if (this.loaderIndicesCollection !== collection) {
      this.loaderIndices = [];
      collection.rootKeys.forEach((key, index) => {
        if (collection.getNode(key)?.type === "loader") this.loaderIndices.push(index);
      });
      this.loaderIndicesCollection = collection;
    }

    return this.loaderIndices;
  }

  /**
   * The root positions that are placed wherever the window is.
   *
   * Loaders, because a sentinel that is not in the DOM can never report that it came into view,
   * so the next page would never be asked for. Persisted keys, because the roving tab stop lives
   * on the focused row and losing its element drops focus to the document.
   */
  private indicesPlacedOutsideTheRegion(): Set<number> {
    const indices = this.persistedIndices(this.host!.collection.rootKeys);

    for (const index of this.rootLoaderIndices()) indices.add(index);

    return indices;
  }

  /**
   * Where the persisted keys sit among `keys`.
   *
   * A persisted key can be a cell as easily as a row — the roving tab stop lives on whichever
   * element holds focus — and a cell needs its row placed or it has nowhere to live. So a key
   * that is not one of these walks up until it finds the ancestor that is.
   */
  protected persistedIndices(keys: readonly VirtualizerKey[]): Set<number> {
    const collection = this.host!.collection;
    const indices = new Set<number>();

    for (const key of this.host!.persistedKeys) {
      let node = collection.getNode(key);

      while (node && keys[node.index] !== node.key) {
        node = node.parentKey == null ? undefined : collection.getNode(node.parentKey);
      }

      if (node) indices.add(node.index);
    }

    return indices;
  }

  /** Where the row at `index` sits, when the stride is arithmetic. */
  protected rowOffset(index: number): number {
    return this.padding + index * ((this.rowSize ?? DEFAULT_ROW_SIZE) + this.gap);
  }

  /**
   * The first root index the requested region can reach, or `0` when it cannot be worked out.
   *
   * The rows above it are the ones the walk would only have counted, so starting there is the
   * same layout for none of the walking.
   */
  protected firstRequestedIndex(offset: number, rowStride: number): number {
    if (!this.hasArithmeticStride) return 0;

    // The row *before* the region is kept, matching the walk's own `y + rowStride < y0` skip.
    return Math.max(0, Math.ceil((this.requestedRect.y - offset) / rowStride - 1));
  }

  /**
   * Moves the computed region onto `rect`, and covers every persisted key.
   *
   * The region only grows without bound when a row's offset depends on the rows above it. With a
   * fixed stride it tracks the window instead, and the rows it has left behind are dropped —
   * otherwise scrolling to the end of a long collection would leave a layout node per row cached
   * for as long as the layout lived.
   */
  protected layoutIfNeeded(rect: Rect): void {
    if (!this.lastCollection) return;

    if (!this.requestedRect.containsRect(rect)) {
      this.requestedRect = this.hasArithmeticStride ? rect.copy() : this.requestedRect.union(rect);
      this.rootNodes = this.buildCollection();
      // Nothing in the region was measured, so everything just placed in it is known-good.
      if (this.hasArithmeticStride) {
        this.validRect = this.requestedRect.copy();
        this.pruneLayoutNodes();
      }
    }

    for (const key of this.host!.persistedKeys) {
      if (this.ensureLayoutInfo(key)) return;
    }
  }

  /**
   * Drops the rows the region has moved away from.
   *
   * Only rows and their cells: a table's header, its columns and its body are placed once and
   * read by everything else, and a row that something still depends on — the one holding the
   * roving tab stop — has to keep its element.
   */
  private pruneLayoutNodes(): void {
    for (const [key, layoutNode] of this.layoutNodes) {
      const type = layoutNode.node?.type ?? layoutNode.layoutInfo.type;

      if (type !== "item" && type !== "row" && type !== "cell") continue;

      if (
        layoutNode.layoutInfo.rect.intersects(this.requestedRect) ||
        this.host!.persistedKeys.has(key) ||
        (layoutNode.layoutInfo.parentKey != null &&
          this.host!.persistedKeys.has(layoutNode.layoutInfo.parentKey))
      ) {
        continue;
      }

      this.layoutNodes.delete(key);
    }
  }

  /**
   * Places a key the lazy pass never reached.
   *
   * Pressing End, or restoring focus to a selected row, asks about a key at an arbitrary offset.
   * With a fixed stride that offset is arithmetic, so the one row is placed and nothing else is.
   * Without one there is no way to know where it sits but to lay out everything above it.
   */
  private ensureLayoutInfo(key: VirtualizerKey): boolean {
    if (this.layoutNodes.has(key) || !this.lastCollection) return false;

    const node = this.lastCollection.getNode(key);

    if (this.hasArithmeticStride && (node?.type === "item" || node?.type === "row")) {
      // A persisted row has to be in the tree that gets rendered and not only in the cache, so
      // the pass runs again — which places it, because a persisted row is placed wherever it is.
      if (this.host!.persistedKeys.has(key)) {
        this.rootNodes = this.buildCollection();

        return true;
      }

      this.buildChild(node, this.padding, this.rowOffset(node.index), null);

      return false;
    }

    if (this.requestedRect.area >= this.contentSize.area) return false;

    this.requestedRect = new Rect(0, 0, Infinity, Infinity);
    this.rootNodes = this.buildCollection();
    this.requestedRect = new Rect(0, 0, this.contentSize.width, this.contentSize.height);

    return true;
  }

  private replaceLayoutInfo(
    key: VirtualizerKey,
    oldLayoutInfo: LayoutInfo,
    newLayoutInfo: LayoutInfo,
  ) {
    const layoutNode = this.layoutNodes.get(key);

    if (!layoutNode) return;

    layoutNode.validRect = layoutNode.validRect.intersection(this.validRect);

    if (layoutNode.layoutInfo === oldLayoutInfo) layoutNode.layoutInfo = newLayoutInfo;
  }

  protected buildCollection(offset: number = this.padding): LayoutNode[] {
    const collection = this.host!.collection;
    const rootKeys = collection.rootKeys;
    const nodes: LayoutNode[] = [];
    const isEmpty = collection.itemCount === 0;
    const rowStride = (this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE) + this.gap;
    const pending = this.indicesPlacedOutsideTheRegion();
    // The rows above the region are the ones the walk would only have counted, so with an
    // arithmetic stride it starts at the region instead of counting its way down to it.
    const start = isEmpty ? 0 : this.firstRequestedIndex(offset, rowStride);

    let y = (isEmpty ? 0 : offset) + start * rowStride;

    // What sits above the region is placed before the walk reaches it, at the offset the stride
    // gives it. Only an arithmetic stride can start above zero, so that offset is exact.
    for (const index of [...pending].sort((a, b) => a - b)) {
      if (index >= start) break;

      const node = collection.getNode(rootKeys[index]!);

      if (node) nodes.push(this.buildChild(node, this.padding, offset + index * rowStride, null));

      pending.delete(index);
    }

    for (let index = start; index < rootKeys.length; index += 1) {
      const key = rootKeys[index]!;
      const node = collection.getNode(key);

      if (!node) continue;

      const isRow = node.type === "item" || node.type === "row";

      // Rows that end above the region asked about are accounted for, not built. This is what
      // makes a thousand-row collection cost a screenful.
      if (
        isRow &&
        y + rowStride < this.requestedRect.y &&
        !this.isValid(node, y) &&
        !pending.has(index)
      ) {
        y += rowStride;
        continue;
      }

      const layoutNode = this.buildChild(node, this.padding, y, null);

      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      nodes.push(layoutNode);
      pending.delete(index);

      if (!(isRow || node.type === "loader") || y <= this.requestedRect.maxY) continue;

      // Past the region: place what has to exist wherever it sits at its estimated offset, then
      // account for the rows in between so the scrollbar still describes the whole collection.
      let lastIndex = index;

      for (const pendingIndex of [...pending].sort((a, b) => a - b)) {
        const pendingNode = collection.getNode(rootKeys[pendingIndex]!);

        if (!pendingNode || pendingIndex <= lastIndex) continue;

        y += (pendingIndex - lastIndex - 1) * rowStride;

        const placed = this.buildChild(pendingNode, this.padding, y, null);

        nodes.push(placed);
        y = placed.layoutInfo.rect.maxY;
        lastIndex = pendingIndex;
      }

      y += (rootKeys.length - lastIndex - 1) * rowStride;
      break;
    }

    // The gap only sits *between* items, so the one added after the last is taken back.
    y = Math.max(y - this.gap, 0);
    y += isEmpty ? 0 : this.padding;

    this.contentSize = new Size(this.host!.size.width, y);

    return nodes;
  }

  protected buildChild(
    node: VirtualizerNode,
    x: number,
    y: number,
    parentKey: VirtualizerKey | null,
  ): LayoutNode {
    if (this.isValid(node, y)) return this.layoutNodes.get(node.key)!;

    const layoutNode = this.buildNode(node, x, y);

    layoutNode.layoutInfo.parentKey = parentKey;
    // Every child may spill outside its own box: the wrapper is sized by the layout, while what
    // is inside it — a focus ring, a shadow — is not.
    layoutNode.layoutInfo.allowOverflow = true;
    this.layoutNodes.set(node.key, layoutNode);

    return layoutNode;
  }

  protected buildNode(node: VirtualizerNode, x: number, y: number): LayoutNode {
    switch (node.type) {
      case "item":
      case "row":
        return this.buildItem(node, x, y);
      case "loader":
        return this.buildLoader(node, x, y);
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  protected buildItem(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const width = this.host!.size.width - this.padding - x;
    let height = this.rowSize;
    let isEstimated = false;

    if (height == null) {
      const previous = this.layoutNodes.get(node.key);

      // A row that has already been measured keeps that height. It is only an estimate again if
      // the row got narrower or wider, or if the datum behind it changed — either can reflow it.
      if (previous) {
        height = previous.layoutInfo.rect.height;
        isEstimated =
          width !== previous.layoutInfo.rect.width ||
          node !== previous.node ||
          previous.layoutInfo.estimatedSize;
      } else {
        height = this.estimatedRowSize;
        isEstimated = true;
      }
    }

    const layoutInfo = new LayoutInfo(
      node.type,
      node.key,
      new Rect(x, y, width, height ?? DEFAULT_ROW_SIZE),
    );

    layoutInfo.estimatedSize = isEstimated;

    return {
      children: [],
      layoutInfo,
      node,
      validRect: layoutInfo.rect.intersection(this.requestedRect),
    };
  }

  /**
   * Whether a cached row can be reused as it stands.
   *
   * Everything here has to hold: nothing global was invalidated, the datum is the same object,
   * the row is at the same offset, it sits inside the known-good region, and the part of it that
   * was computed covers the part now being asked about.
   */
  protected isValid(node: VirtualizerNode, y: number): boolean {
    const cached = this.layoutNodes.get(node.key);

    return (
      !this.invalidateEverything &&
      !!cached &&
      cached.node === node &&
      cached.layoutInfo.rect.y === y &&
      cached.layoutInfo.rect.intersects(this.validRect) &&
      cached.validRect.containsRect(cached.layoutInfo.rect.intersection(this.requestedRect))
    );
  }

  protected buildLoader(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const width = this.host!.size.width - this.padding - x;
    const height = this.loaderSize ?? this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE;
    const layoutInfo = new LayoutInfo("loader", node.key, new Rect(x, y, width, height));

    layoutInfo.estimatedSize = this.loaderSize == null && this.rowSize == null;

    return {
      children: [],
      layoutInfo,
      node,
      validRect: layoutInfo.rect.intersection(this.requestedRect),
    };
  }

  /**
   * Whether a node belongs in the rendered set.
   *
   * A sticky element, a header and a loader are always in it — they are on screen at offsets the
   * rectangle does not describe. A persisted key is in it because something depends on the
   * element existing: the roving tab stop lives on the focused item, and losing its element
   * would drop focus to the document.
   */
  protected isVisible(node: LayoutNode, rect: Rect): boolean {
    return (
      node.layoutInfo.rect.intersects(rect) ||
      node.layoutInfo.isSticky ||
      node.layoutInfo.type === "header" ||
      node.layoutInfo.type === "loader" ||
      this.host!.isPersistedKey(node.layoutInfo.key)
    );
  }

  /* -----------------------------------------------------------------------------------------
   * Drop targets
   * ---------------------------------------------------------------------------------------*/

  /**
   * Whether a laid-out element is somewhere a drop could land.
   *
   * The one thing a table changes: its rendered set holds cells and column headers as well as
   * rows, and only a row is a drop target.
   */
  protected isDropCandidate(_layoutInfo: LayoutInfo): boolean {
    return true;
  }

  /**
   * The nearest row edge to a point, ported from React Aria's `ListLayout`.
   *
   * The search is a one-pixel-wide sliver rather than a hit test, and it measures distance to
   * each candidate's **edges** rather than to its middle — the question a drop asks is "which
   * boundary is this nearest", and between two rows the answer belongs to whichever edge is
   * closer, not to whichever row the pointer happens to be over.
   */
  override getDropTargetFromPoint(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget | null {
    const visibleRect = this.host!.visibleRect;
    const pointX = x + visibleRect.x;
    const pointY = y + visibleRect.y;

    // Tall enough to reach across the gap between two rows, and no taller: anything further
    // away is a different boundary.
    const searchRect = new Rect(
      pointX,
      Math.max(0, pointY - this.gap),
      1,
      Math.max(1, this.gap * 2),
    );

    let key: VirtualizerKey | null = null;
    let minDistance = Infinity;

    for (const candidate of this.getVisibleLayoutInfos(searchRect)) {
      // A persisted key is in the rendered set wherever it is, so it can come back from far
      // outside the sliver.
      if (!this.isDropCandidate(candidate) || !candidate.rect.intersects(searchRect)) continue;

      const distance = Math.min(
        Math.abs(candidate.rect.y - pointY),
        Math.abs(candidate.rect.maxY - pointY),
      );

      if (distance < minDistance) {
        minDistance = distance;
        key = candidate.key;
      }
    }

    if (key == null || this.host!.collection.itemCount === 0) return { type: "root" };

    const layoutInfo = this.getLayoutInfo(key);

    if (!layoutInfo) return null;

    const rect = layoutInfo.rect;
    const target: DropTarget = { dropPosition: "on", key: layoutInfo.key, type: "item" };

    /**
     * Where within the row the point means.
     *
     * Dropping on the row wins the middle when it is allowed, and before/after only take the
     * outer 10px. When it is not allowed the row splits down the middle instead, so every
     * pixel resolves to one side or the other.
     */
    if (!isValidDropTarget(target)) {
      if (
        pointY <= rect.y + rect.height / 2 &&
        isValidDropTarget({ ...target, dropPosition: "before" })
      ) {
        target.dropPosition = "before";
      } else if (isValidDropTarget({ ...target, dropPosition: "after" })) {
        target.dropPosition = "after";
      }
    } else if (pointY <= rect.y + 10 && isValidDropTarget({ ...target, dropPosition: "before" })) {
      target.dropPosition = "before";
    } else if (
      pointY >= rect.maxY - 10 &&
      isValidDropTarget({ ...target, dropPosition: "after" })
    ) {
      target.dropPosition = "after";
    }

    return target;
  }

  /**
   * Where the indicator for a gap is placed.
   *
   * A band of `dropIndicatorThickness` straddling the boundary — half above it and half below —
   * so a two-pixel line sits *on* the edge rather than pushing the rows apart. Dropping onto a
   * row instead covers the whole row, which is what lets it be highlighted.
   *
   * One branch of React Aria's version is deliberately absent: it walks "after" down past the
   * target's descendants so the line lands below a whole open subtree. A `VirtualizerNode` here
   * carries no level, because a windowed collection is built from flat data and this build has
   * no virtualized tree to be wrong about. It would have to come back with one.
   */
  override getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo {
    const layoutInfo = this.getLayoutInfo(target.key);
    const rect = layoutInfo?.rect ?? new Rect();
    const thickness = this.dropIndicatorThickness;
    let indicatorRect: Rect;

    if (target.dropPosition === "before") {
      indicatorRect = new Rect(rect.x, Math.max(0, rect.y - thickness / 2), rect.width, thickness);
    } else if (target.dropPosition === "after") {
      indicatorRect = new Rect(rect.x, rect.maxY - thickness / 2, rect.width, thickness);
    } else {
      indicatorRect = rect;
    }

    return new LayoutInfo("dropIndicator", `${target.key}:${target.dropPosition}`, indicatorRect);
  }
}
