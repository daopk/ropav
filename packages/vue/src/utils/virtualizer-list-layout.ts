import type {InvalidationContext, VirtualizerNode} from "./virtualizer-layout";
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
  }

  protected buildCollection(offset: number = this.padding): LayoutNode[] {
    const collection = this.host!.collection;
    const nodes: LayoutNode[] = [];
    const isEmpty = collection.itemCount === 0;

    let y = isEmpty ? 0 : offset;

    for (const key of collection.rootKeys) {
      const node = collection.getNode(key);

      if (!node) continue;

      const layoutNode = this.buildChild(node, this.padding, y, null);

      y = layoutNode.layoutInfo.rect.maxY + this.gap;
      nodes.push(layoutNode);
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
    const height = this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE;
    const layoutInfo = new LayoutInfo(node.type, node.key, new Rect(x, y, width, height));

    layoutInfo.estimatedSize = this.rowSize == null;

    return {children: [], layoutInfo, node, validRect: layoutInfo.rect.copy()};
  }

  protected buildLoader(node: VirtualizerNode, x: number, y: number): LayoutNode {
    const width = this.host!.size.width - this.padding - x;
    const height = this.loaderSize ?? this.rowSize ?? this.estimatedRowSize ?? DEFAULT_ROW_SIZE;
    const layoutInfo = new LayoutInfo("loader", node.key, new Rect(x, y, width, height));

    layoutInfo.estimatedSize = this.loaderSize == null && this.rowSize == null;

    return {children: [], layoutInfo, node, validRect: layoutInfo.rect.copy()};
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
