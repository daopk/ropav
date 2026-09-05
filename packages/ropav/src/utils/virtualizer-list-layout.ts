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
import { RowOffsets } from "./virtualizer-offsets";

/**
 * A stack layout for the virtualizer, ported from React Aria's `ListLayout`.
 *
 * Items are placed one after another along the block axis, each as wide as the scroll container
 * minus the padding. With `rowSize` given the geometry is arithmetic; without it each item is
 * placed at an estimate and corrected once it has been measured.
 *
 * Only the rows a window covers are built, and this is where it parts company with upstream. React
 * Aria records a region it has computed — growing it to cover everywhere the window has been, and
 * walking from the first row to add up offsets on the way — which makes the rendered set a
 * function of where the window has *been* rather than of where it is, and makes a pass cost more
 * the further down the collection it lands.
 *
 * Here a {@link RowOffsets} index holds a start and a size for every row, measured or estimated,
 * so an offset is a lookup and a window is a binary search. There is no region to be inside of, no
 * cache that can disagree with the current scroll offset, and no row a scrollbar can reach that
 * has no offset to answer with — which is what keeps a fast drag from landing on nothing.
 *
 * Two things are absent, both recorded as debt: the horizontal orientation, which no collection in
 * this library uses, and the `section`/`header`/`separator` node types, which cannot reach a
 * layout through the data-driven collection this build has.
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

  /** Where every root sits, whether or not it has ever been built. */
  protected offsets = new RowOffsets();

  /** The window the rendered set was built for, in content coordinates. */
  protected window = new Rect();

  protected lastCollection: VirtualizerCollection | null = null;

  private invalidateEverything = false;

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

  /** Where every root sits, for a caller that needs an offset rather than a rendered node. */
  getRowOffsets(): RowOffsets {
    return this.offsets;
  }

  /**
   * The rectangle grown to whole rows.
   *
   * Without this a one-pixel scroll would change which rows fall inside the rectangle, and the set
   * of rendered elements would churn on every frame.
   *
   * The stride has to be the one rows are actually placed at, gap included, and the height has to
   * absorb however far the top edge moved. Upstream's table snaps by the bare row height and lets
   * the bottom edge fall wherever it lands, which costs a gap of coverage per screen — so a window
   * arrived at by scrolling ends one gap short of where it was asked to reach.
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

    this.layoutFor(searchRect);

    return this.getRenderedLayoutInfos(searchRect);
  }

  /**
   * The same, read off the rendered set as it stands rather than laying one out.
   *
   * Asking `getVisibleLayoutInfos` a question moves the window to whatever was asked about, so a
   * caller with a rectangle narrower than the window — a drop resolving a point — would shrink
   * the rendered set to the width of its own question and prune everything else away.
   */
  protected getRenderedLayoutInfos(rect: Rect): LayoutInfo[] {
    const result: LayoutInfo[] = [];

    const addNodes = (nodes: LayoutNode[]) => {
      for (const node of nodes) {
        if (!this.isVisible(node, rect)) continue;

        result.push(node.layoutInfo);
        addNodes(node.children);
      }
    };

    addNodes(this.rootNodes);

    return result;
  }

  override update(context: InvalidationContext<Options>): void {
    const collection = this.host!.collection;

    // A row's height follows its width, so a container that resized or a size option that moved
    // makes every measurement a guess again.
    this.invalidateEverything = this.shouldInvalidateEverything(context);

    if (this.invalidateEverything) {
      this.layoutNodes.clear();
      this.offsets.reset();
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

    // Before anything has asked for a window, the container's own visible rectangle is the best
    // guess at one — and it is the same window `getVisibleLayoutInfos` is about to snap.
    if (this.window.area <= 0) this.window = this.host!.visibleRect.copy();

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
   * Returns whether anything moved, which is the virtualizer's cue to lay out again. The size goes
   * to the index rather than only onto the rendered node, so the rows below it move even though
   * none of them is in the window, and so the row keeps its height when the window comes back.
   */
  override updateItemSize(key: VirtualizerKey, size: Size): boolean {
    const layoutNode = this.layoutNodes.get(key);

    // A declared row size wins over anything measured, so taking the measurement would only be a
    // layout pass that arrives at the height it already had.
    if (!layoutNode || this.rowSize != null) return false;

    const layoutInfo = layoutNode.layoutInfo;

    layoutInfo.estimatedSize = false;

    if (layoutInfo.rect.height === size.height) return false;

    // Copied rather than mutated, so anything holding the old layout info sees it go stale.
    const measured = layoutInfo.copy();

    measured.rect.height = size.height;
    layoutNode.layoutInfo = measured;
    this.recordMeasuredSize(layoutNode, size.height);
    this.replaceLayoutInfo(key, layoutInfo, measured);

    let parentKey = layoutInfo.parentKey;

    while (parentKey != null) {
      this.replaceLayoutInfo(parentKey, layoutInfo, measured);
      parentKey = this.layoutNodes.get(parentKey)?.layoutInfo.parentKey ?? null;
    }

    return true;
  }

  /**
   * Hands a measurement to the index, when it is a root that the index places.
   *
   * A table's cell is measured too, but a cell does not sit among the roots — its row does, and
   * the row is measured by its tallest cell, so the row's own measurement is the one that lands.
   */
  protected recordMeasuredSize(layoutNode: LayoutNode, height: number): void {
    const node = layoutNode.node;

    if (!node || node.parentKey != null) return;

    this.offsets.measure(node.key, height, node.index);
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
   * The estimated size of a root, which is what the index places it at until it is measured.
   */
  protected estimatedSizeAt(index: number): number {
    const node = this.host!.collection.getNode(this.host!.collection.rootKeys[index]!);

    if (node?.type === "loader") {
      return this.loaderSize ?? this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE;
    }

    return this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE;
  }

  /** How many things the index places. The roots for a list; the body's children for a table. */
  protected get placedCount(): number {
    return this.host!.collection.rootKeys.length;
  }

  /** Points the index at the collection as it stands, which is what makes every offset answerable. */
  protected configureOffsets(start: number = this.padding): void {
    const collection = this.host!.collection;
    const rootKeys = collection.rootKeys;

    this.offsets.configure({
      collection,
      count: rootKeys.length,
      estimate: (index) => this.estimatedSizeAt(index),
      gap: this.gap,
      keyAt: (index) => rootKeys[index]!,
      start,
    });
  }

  /**
   * The roots that are rendered wherever the window is.
   *
   * Loaders, because a sentinel that is not in the DOM can never report that it came into view,
   * so the next page would never be asked for. Persisted keys, because the roving tab stop lives
   * on the focused row and losing its element drops focus to the document.
   */
  protected indicesPlacedOutsideTheWindow(): Set<number> {
    const collection = this.host!.collection;
    const indices = this.persistedIndices(collection.rootKeys);

    collection.rootKeys.forEach((key, index) => {
      if (collection.getNode(key)?.type === "loader") indices.add(index);
    });

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

  /** Where the row at `index` sits. A lookup, for a row nobody has rendered as much as for one. */
  protected rowOffset(index: number): number {
    return this.offsets.startOf(index);
  }

  /**
   * The root indices the pass places, in order.
   *
   * The window plus whatever has to exist outside it. There is nothing to walk to and nothing to
   * account for afterwards: a row's offset is a lookup, so the rows above and below the window
   * cost the pass nothing at all.
   */
  protected windowedIndices(rect: Rect): number[] {
    const indices = this.indicesPlacedOutsideTheWindow();

    // A window with no area is a container nobody has measured yet, not a window at the origin.
    // Only what has to exist wherever the window is belongs in it.
    if (rect.area > 0) {
      const { first, last } = this.offsets.rangeFor(rect.y, rect.height);

      for (let index = first; index <= last; index += 1) indices.add(index);
    }

    return [...indices]
      .filter((index) => index >= 0 && index < this.placedCount)
      .sort((a, b) => a - b);
  }

  /** Builds the rendered set for a window, and drops what that window has left behind. */
  protected layoutFor(rect: Rect): void {
    if (!this.lastCollection) return;

    this.window = rect.copy();
    this.rootNodes = this.buildCollection();
    this.pruneLayoutNodes();
  }

  /**
   * Drops the rows the window has moved away from.
   *
   * Only rows and their cells: a table's header, its columns and its body are placed once and
   * read by everything else, and a row that something still depends on — the one holding the
   * roving tab stop — has to keep its element.
   */
  protected pruneLayoutNodes(): void {
    for (const [key, layoutNode] of this.layoutNodes) {
      const type = layoutNode.node?.type ?? layoutNode.layoutInfo.type;

      if (type !== "item" && type !== "row" && type !== "cell") continue;

      if (
        layoutNode.layoutInfo.rect.intersects(this.window) ||
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
   * Places a key the windowed pass never reached.
   *
   * Pressing End, or restoring focus to a selected row, asks about a key at an arbitrary offset.
   * That offset is a lookup whatever the rows are, so the one row is placed and nothing else is.
   */
  private ensureLayoutInfo(key: VirtualizerKey): void {
    if (this.layoutNodes.has(key) || !this.lastCollection) return;

    const node = this.lastCollection.getNode(key);
    const offset = node == null ? null : this.indexedOffset(node);

    if (node == null || offset == null) return;

    this.buildChild(node, this.padding, offset, node.parentKey);
  }

  /** Where the index puts a node, or `null` for one it does not place. */
  protected indexedOffset(node: VirtualizerNode): number | null {
    return node.parentKey == null ? this.rowOffset(node.index) : null;
  }

  private replaceLayoutInfo(
    key: VirtualizerKey,
    oldLayoutInfo: LayoutInfo,
    newLayoutInfo: LayoutInfo,
  ) {
    const layoutNode = this.layoutNodes.get(key);

    if (!layoutNode) return;

    if (layoutNode.layoutInfo === oldLayoutInfo) layoutNode.layoutInfo = newLayoutInfo;
  }

  protected buildCollection(offset: number = this.padding): LayoutNode[] {
    const collection = this.host!.collection;
    const rootKeys = collection.rootKeys;
    const nodes: LayoutNode[] = [];
    const isEmpty = collection.itemCount === 0;

    this.configureOffsets(offset);

    for (const index of this.windowedIndices(this.window)) {
      const node = collection.getNode(rootKeys[index]!);

      if (node) nodes.push(this.buildChild(node, this.padding, this.offsets.startOf(index), null));
    }

    // The height the whole collection comes to, which is what the scrollbar describes. It is the
    // index that knows it, not the pass: every row has an offset whether or not it was built, so
    // this stays a function of the data however far the window has been scrolled.
    this.contentSize = new Size(
      this.host!.size.width,
      isEmpty ? 0 : this.offsets.total() + this.padding,
    );

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
    const previous = this.layoutNodes.get(node.key);
    let height = this.rowSize;
    let isEstimated = false;

    if (height == null) {
      // The index holds the height, not the cached node — which is what lets a row that scrolled
      // out of the window and back in keep its measurement instead of being placed at an estimate
      // for a frame. It is an estimate again if the row got narrower or wider, or if the datum
      // behind it changed: either can reflow it.
      height = this.offsets.size(node.index);
      isEstimated =
        !this.offsets.isMeasured(node.index) ||
        (previous != null && (width !== previous.layoutInfo.rect.width || node !== previous.node));
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
    };
  }

  /**
   * Whether a cached row can be reused as it stands.
   *
   * Three things: nothing global was invalidated, the datum is the same object, and the row is
   * still at the same offset. There is no region to be inside of any more — a row's offset comes
   * from the index, so being at the offset the index gives it *is* the whole of being current.
   */
  protected isValid(node: VirtualizerNode, y: number): boolean {
    const cached = this.layoutNodes.get(node.key);

    return (
      !this.invalidateEverything &&
      !!cached &&
      cached.node === node &&
      cached.layoutInfo.rect.y === y
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

    for (const candidate of this.getRenderedLayoutInfos(searchRect)) {
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
