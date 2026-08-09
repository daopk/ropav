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
  }

  getContentSize(): Size {
    return this.contentSize;
  }

  getLayoutInfo(key: VirtualizerKey): LayoutInfo | null {
    this.ensureLayoutInfo(key);

    return this.layoutNodes.get(key)?.layoutInfo ?? null;
  }

  /**
   * Every layout info inside `rect`, parents before children.
   *
   * The rectangle is first grown to whole rows. Without that a one-pixel scroll would change
   * which rows fall inside it, and the set of rendered elements would churn on every frame.
   */
  getVisibleLayoutInfos(rect: Rect): LayoutInfo[] {
    let searchRect = rect;

    if (searchRect.height > 1) {
      const rowSize = (this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE) + this.gap;

      searchRect = searchRect.copy();

      const y = Math.floor(searchRect.y / rowSize) * rowSize;
      const height = searchRect.height + searchRect.y - y;

      searchRect.y = y;
      searchRect.height = Math.ceil(height / rowSize) * rowSize;
    }

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
}
