import type {DropTarget, ItemDropTarget} from "./dnd-types";
import type {
  InvalidationContext,
  VirtualizerCollection,
  VirtualizerNode,
} from "./virtualizer-layout";
import type {VirtualizerKey} from "./virtualizer-layout-info";

import {Rect, Size} from "./virtualizer-geometry";
import {Layout} from "./virtualizer-layout";
import {LayoutInfo} from "./virtualizer-layout-info";

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
 * Two things are deliberately absent, both recorded as debt: the horizontal orientation, which no
 * HeroUI collection uses, and the `section`/`header`/`separator` node types, which cannot reach a
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
  /** @deprecated Use `rowSize`. Accepted because React Aria still does. */
  rowHeight?: number;
  /** @deprecated Use `estimatedRowSize`. */
  estimatedRowHeight?: number;
  /** @deprecated Use `headingSize`. */
  headingHeight?: number;
  /** @deprecated Use `estimatedHeadingSize`. */
  estimatedHeadingHeight?: number;
  /** @deprecated Use `loaderSize`. */
  loaderHeight?: number;
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

  constructor(options: ListLayoutOptions = {}) {
    super();
    this.rowSize = options.rowSize ?? options.rowHeight ?? null;
    this.estimatedRowSize = options.estimatedRowSize ?? options.estimatedRowHeight ?? null;
    this.headingSize = options.headingSize ?? options.headingHeight ?? null;
    this.estimatedHeadingSize =
      options.estimatedHeadingSize ?? options.estimatedHeadingHeight ?? null;
    this.loaderSize = options.loaderSize ?? options.loaderHeight ?? null;
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

    this.rowSize = options?.rowSize ?? options?.rowHeight ?? this.rowSize;
    this.estimatedRowSize =
      options?.estimatedRowSize ?? options?.estimatedRowHeight ?? this.estimatedRowSize;
    this.headingSize = options?.headingSize ?? options?.headingHeight ?? this.headingSize;
    this.estimatedHeadingSize =
      options?.estimatedHeadingSize ?? options?.estimatedHeadingHeight ?? this.estimatedHeadingSize;
    this.loaderSize = options?.loaderSize ?? options?.loaderHeight ?? this.loaderSize;
    this.gap = options?.gap ?? this.gap;
    this.padding = options?.padding ?? this.padding;
    this.dropIndicatorThickness = options?.dropIndicatorThickness ?? this.dropIndicatorThickness;

    this.rootNodes = this.buildCollection();

    if (this.lastCollection && collection !== this.lastCollection) {
      for (const key of this.lastCollection.keys) {
        if (!collection.getNode(key)) this.layoutNodes.delete(key);
      }
    }

    this.lastCollection = collection;
    this.invalidateEverything = false;
    this.validRect = this.requestedRect.copy();
  }

  override shouldInvalidateLayoutOptions(newOptions: Options, oldOptions: Options): boolean {
    return (
      (newOptions?.rowSize ?? newOptions?.rowHeight) !==
        (oldOptions?.rowSize ?? oldOptions?.rowHeight) ||
      (newOptions?.estimatedRowSize ?? newOptions?.estimatedRowHeight) !==
        (oldOptions?.estimatedRowSize ?? oldOptions?.estimatedRowHeight) ||
      (newOptions?.headingSize ?? newOptions?.headingHeight) !==
        (oldOptions?.headingSize ?? oldOptions?.headingHeight) ||
      (newOptions?.estimatedHeadingSize ?? newOptions?.estimatedHeadingHeight) !==
        (oldOptions?.estimatedHeadingSize ?? oldOptions?.estimatedHeadingHeight) ||
      (newOptions?.loaderSize ?? newOptions?.loaderHeight) !==
        (oldOptions?.loaderSize ?? oldOptions?.loaderHeight) ||
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
      this.rowSize !== (options?.rowSize ?? options?.rowHeight ?? this.rowSize) ||
      this.headingSize !== (options?.headingSize ?? options?.headingHeight ?? this.headingSize) ||
      this.loaderSize !== (options?.loaderSize ?? options?.loaderHeight ?? this.loaderSize) ||
      this.gap !== (options?.gap ?? this.gap) ||
      this.padding !== (options?.padding ?? this.padding),
    );
  }

  /** Extends the computed region to cover `rect`, and to cover every persisted key. */
  protected layoutIfNeeded(rect: Rect): void {
    if (!this.lastCollection) return;

    if (!this.requestedRect.containsRect(rect)) {
      this.requestedRect = this.requestedRect.union(rect);
      this.rootNodes = this.buildCollection();
    }

    for (const key of this.host!.persistedKeys) {
      if (this.ensureLayoutInfo(key)) return;
    }
  }

  /**
   * Computes the whole layout when a key is asked about that the lazy pass never reached.
   *
   * Pressing End, or restoring focus to a selected row, asks about a key at an arbitrary offset;
   * there is no way to know where it sits without laying out everything above it.
   */
  private ensureLayoutInfo(key: VirtualizerKey): boolean {
    if (
      this.layoutNodes.has(key) ||
      !this.lastCollection ||
      this.requestedRect.area >= this.contentSize.area
    ) {
      return false;
    }

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
    // Loaders are kept whatever the window is: a sentinel that is not in the DOM can never
    // report that it came into view, so the next page would never be asked for.
    const pendingLoaderKeys = rootKeys.filter((key) => collection.getNode(key)?.type === "loader");

    let y = isEmpty ? 0 : offset;

    for (const [index, key] of rootKeys.entries()) {
      const node = collection.getNode(key);

      if (!node) continue;

      const isRow = node.type === "item" || node.type === "row";

      // Rows that end above the region asked about are accounted for, not built. This is what
      // makes a thousand-row collection cost a screenful.
      if (isRow && y + rowStride < this.requestedRect.y && !this.isValid(node, y)) {
        y += rowStride;
        continue;
      }

      const layoutNode = this.buildChild(node, this.padding, y, null);

      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      nodes.push(layoutNode);

      if (node.type === "loader") {
        pendingLoaderKeys.splice(pendingLoaderKeys.indexOf(key), 1);
      }

      if (!(isRow || node.type === "loader") || y <= this.requestedRect.maxY) continue;

      // Past the region: place any remaining loader at its estimated offset, then account for
      // the rows in between so the scrollbar still describes the whole collection.
      let lastIndex = index;

      for (const loaderKey of pendingLoaderKeys) {
        const loaderNode = collection.getNode(loaderKey);

        if (!loaderNode) continue;

        const loaderIndex = rootKeys.indexOf(loaderKey);

        y += (loaderIndex - lastIndex - 1) * rowStride;

        const loader = this.buildChild(loaderNode, this.padding, y, null);

        nodes.push(loader);
        y = loader.layoutInfo.rect.maxY;
        lastIndex = loaderIndex;
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

    if (key == null || this.host!.collection.itemCount === 0) return {type: "root"};

    const layoutInfo = this.getLayoutInfo(key);

    if (!layoutInfo) return null;

    const rect = layoutInfo.rect;
    const target: DropTarget = {dropPosition: "on", key: layoutInfo.key, type: "item"};

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
        isValidDropTarget({...target, dropPosition: "before"})
      ) {
        target.dropPosition = "before";
      } else if (isValidDropTarget({...target, dropPosition: "after"})) {
        target.dropPosition = "after";
      }
    } else if (pointY <= rect.y + 10 && isValidDropTarget({...target, dropPosition: "before"})) {
      target.dropPosition = "before";
    } else if (pointY >= rect.maxY - 10 && isValidDropTarget({...target, dropPosition: "after"})) {
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
