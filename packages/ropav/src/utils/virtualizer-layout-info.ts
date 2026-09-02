import type { Rect } from "./virtualizer-geometry";

/**
 * What a layout hands the virtualizer for one element, ported from React Aria's `LayoutInfo`
 * and `layoutInfoToStyle`.
 *
 * A layout never renders anything. It produces these descriptions — position, size and a little
 * style — and the virtualizer turns each one into a wrapper element around the item's own markup.
 */

/** A collection key. Same shape as the collection's own key type. */
export type VirtualizerKey = string | number;

export class LayoutInfo {
  /** Matches the `type` of the collection node this describes. */
  type: string;

  /** Matches the `key` of the collection node this describes. */
  key: VirtualizerKey;

  /** The key of the enclosing layout info, when this one is nested. */
  parentKey: VirtualizerKey | null;

  /** Content the layout generated itself, rather than reading from the collection. */
  content: unknown;

  /** Where the element sits and how big it is. */
  rect: Rect;

  /**
   * Whether `rect`'s size is a guess. An estimated element is measured the first time it lands
   * in the DOM, and the layout is redone with what came back.
   */
  estimatedSize: boolean;

  /** Whether the element stays put while the collection scrolls past it. */
  isSticky: boolean;

  opacity: number;

  transform: string | null;

  zIndex: number;

  /** Whether content is allowed to spill outside the element's own box. */
  allowOverflow: boolean;

  constructor(type: string, key: VirtualizerKey, rect: Rect) {
    this.type = type;
    this.key = key;
    this.parentKey = null;
    this.content = null;
    this.rect = rect;
    this.estimatedSize = false;
    this.isSticky = false;
    this.opacity = 1;
    this.transform = null;
    this.zIndex = 0;
    this.allowOverflow = false;
  }

  copy(): LayoutInfo {
    const copy = new LayoutInfo(this.type, this.key, this.rect.copy());

    copy.parentKey = this.parentKey;
    copy.content = this.content;
    copy.estimatedSize = this.estimatedSize;
    copy.isSticky = this.isSticky;
    copy.opacity = this.opacity;
    copy.transform = this.transform;
    copy.zIndex = this.zIndex;
    copy.allowOverflow = this.allowOverflow;

    return copy;
  }
}

/** The style of one virtualizer wrapper. Values carry their unit, see below. */
export type LayoutInfoStyle = Record<string, string | number | undefined>;

const px = (value: number): string | undefined =>
  Number.isFinite(value) ? `${value}px` : undefined;

/**
 * The inline style for the wrapper around an item.
 *
 * Two things differ from React Aria on purpose, neither of them visible in the result:
 *
 * Lengths are written with `px` rather than left as bare numbers. React appends the unit itself
 * for dimensional properties; Vue writes `String(value)` straight onto the style object, so a
 * bare number would come out as an invalid declaration and be dropped.
 *
 * There is no memoisation. React caches the style object per layout info in a `WeakMap` to keep
 * its element from re-rendering; here the style is read inside the render of a wrapper that is
 * already keyed by the item, so a cache would only add a way for a stale parent offset to
 * survive.
 *
 * `direction` is not taken: the inline axis is always `left`. RTL needs a locale layer that does
 * not exist yet, and getting it wrong silently is worse than not offering it.
 */
export const layoutInfoToStyle = (
  layoutInfo: LayoutInfo,
  parent?: LayoutInfo | null,
): LayoutInfoStyle => {
  // A sticky element inside a parent that lets content overflow is positioned against the
  // nearest scrolling ancestor rather than against that parent, so its offset is not relative.
  const isRelativeToParent = Boolean(parent && !(parent.allowOverflow && layoutInfo.isSticky));
  const offsetParent = isRelativeToParent ? parent! : null;
  // A height nobody has measured is left to the content, and size containment with it. Writing the
  // estimate onto the element and then measuring through it reads the guess back — the natural
  // height *is* the measurement, and it is also the right height to render at meanwhile. Set to
  // `auto` rather than left out, so a stylesheet height on the element cannot read it back either.
  const isEstimated = layoutInfo.estimatedSize;

  return {
    contain: isEstimated ? "layout style" : "size layout style",
    // A sticky element is laid out in normal flow. `inline-block` keeps several of them on one
    // line instead of each pushing the next onto a row of its own.
    display: layoutInfo.isSticky ? "inline-block" : undefined,
    height: isEstimated ? "auto" : px(layoutInfo.rect.height),
    left: px(layoutInfo.rect.x - (offsetParent?.rect.x ?? 0)),
    opacity: layoutInfo.opacity,
    overflow: layoutInfo.allowOverflow ? "visible" : "hidden",
    position: layoutInfo.isSticky ? "sticky" : "absolute",
    top: px(layoutInfo.rect.y - (offsetParent?.rect.y ?? 0)),
    transform: layoutInfo.transform ?? undefined,
    width: px(layoutInfo.rect.width),
    zIndex: layoutInfo.zIndex,
  };
};
