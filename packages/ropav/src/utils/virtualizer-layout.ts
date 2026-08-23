import type { DropTarget, ItemDropTarget } from "./dnd-types";
import type { Rect, Size } from "./virtualizer-geometry";
import type { LayoutInfo, VirtualizerKey } from "./virtualizer-layout-info";

/**
 * The contract between a virtualizer and its layout, ported from React Aria's `Layout`.
 *
 * A layout answers three questions — what is inside a rectangle, where does one key sit, and how
 * big is the whole content — and the virtualizer renders from the answers. Everything else is
 * optional.
 */

/**
 * What kind of element a node describes.
 *
 * The set matches React Aria's node types, because the layouts branch on them: a section is
 * measured by its children, a header and a loader by their own option, an item by the row size.
 */
export type VirtualizerNodeType =
  | "cell"
  | "column"
  | "header"
  | "headerrow"
  | "item"
  | "loader"
  | "row"
  | "rowgroup"
  | "section"
  | "separator";

/**
 * One entry of the collection a layout walks.
 *
 * React Aria gets these by rendering the collection into a hidden tree first, so the parent knows
 * every node before the first paint. That pass does not exist here — rendering is what creates
 * DOM — so the nodes are built from the data the collection was given, and `childKeys` is what
 * carries the shape a table needs (header → header row → columns, body → rows → cells).
 */
export interface VirtualizerNode {
  key: VirtualizerKey;
  type: VirtualizerNodeType;
  /** The enclosing node, or `null` at the root. */
  parentKey: VirtualizerKey | null;
  /** Position among siblings, zero-based. Drives `aria-posinset` and `aria-rowindex`. */
  index: number;
  /** Children in order. Empty for a leaf. */
  childKeys: VirtualizerKey[];
  /** Text the node is matched on by typeahead. */
  textValue?: string;
  isDisabled?: boolean;
  /** The datum this node was built from, handed back to whoever renders the node. */
  content?: unknown;
}

/** The collection a layout reads. Deliberately smaller than React Aria's `Collection`. */
export interface VirtualizerCollection {
  /** How many nodes of type `item`/`row` there are — what `aria-setsize` reports. */
  readonly itemCount: number;
  /** Every node, in document order. */
  readonly keys: VirtualizerKey[];
  readonly rootKeys: VirtualizerKey[];
  getNode: (key: VirtualizerKey) => VirtualizerNode | undefined;
  getChildNodes: (key: VirtualizerKey) => VirtualizerNode[];
}

/**
 * Why a layout is being asked to run again.
 *
 * A layout reads these to decide how much of itself to throw away: a size change invalidates
 * every measurement, while a scroll usually invalidates nothing.
 */
export interface InvalidationContext<Options = unknown> {
  contentChanged?: boolean;
  offsetChanged?: boolean;
  sizeChanged?: boolean;
  itemSizeChanged?: boolean;
  layoutOptions?: Options;
}

/** What a layout may ask of the virtualizer it is attached to. */
export interface VirtualizerLayoutHost {
  readonly collection: VirtualizerCollection;
  readonly persistedKeys: Set<VirtualizerKey>;
  /** The visible rectangle in content coordinates. */
  readonly visibleRect: Rect;
  /** The size of the scroll container, which is not the same as the visible rectangle. */
  readonly size: Size;
  isPersistedKey: (key: VirtualizerKey) => boolean;
}

export abstract class Layout<Options = unknown> {
  /** Set by the virtualizer when the layout is attached. */
  host: VirtualizerLayoutHost | null = null;

  /** Every layout info inside `rect`, parents before children. */
  abstract getVisibleLayoutInfos(rect: Rect): LayoutInfo[];

  abstract getLayoutInfo(key: VirtualizerKey): LayoutInfo | null;

  abstract getContentSize(): Size;

  /** Called before either getter, so the layout can compute whatever it needs. */
  update(context: InvalidationContext<Options>): void {
    void context;
  }

  /**
   * Whether a new visible rectangle invalidates the layout. Size changes do by default; a layout
   * that positions something against the scroll offset returns `true` always.
   */
  shouldInvalidate(newRect: Rect, oldRect: Rect): boolean {
    return newRect.width !== oldRect.width || newRect.height !== oldRect.height;
  }

  /** Whether new options invalidate the layout. Identity by default. */
  shouldInvalidateLayoutOptions(newOptions: Options, oldOptions: Options): boolean {
    return newOptions !== oldOptions;
  }

  /** Records a measured size. Returns whether it changed anything. */
  updateItemSize?(key: VirtualizerKey, size: Size): boolean;

  /**
   * Resolves a pointer position to a drop target, making the layout its own
   * {@link DropTargetDelegate}.
   *
   * Optional, and the reason it has to be: the DOM-based delegate searches for elements, and
   * outside the window there are none. A layout knows where every row *would* be, rendered or
   * not, so a windowed collection asks it instead.
   *
   * @param x - Horizontal offset from the collection container's top left corner.
   * @param y - Vertical offset from the same corner.
   */
  getDropTargetFromPoint?(
    x: number,
    y: number,
    isValidDropTarget: (target: DropTarget) => boolean,
  ): DropTarget | null;

  /**
   * Where a drop indicator for the given target belongs.
   *
   * A drop indicator is not in the collection — it sits between two things that are — so nothing
   * has laid it out. This is where the layout says how a gap is placed, which for a stack means
   * a thin band straddling the boundary.
   */
  getDropTargetLayoutInfo?(target: ItemDropTarget): LayoutInfo;

  getItemRect(key: VirtualizerKey): Rect | null {
    return this.getLayoutInfo(key)?.rect ?? null;
  }

  getVisibleRect(): Rect {
    return this.host!.visibleRect;
  }
}
