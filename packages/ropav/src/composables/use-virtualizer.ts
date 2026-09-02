import type {
  InvalidationContext,
  Layout,
  VirtualizerCollection,
  VirtualizerLayoutHost,
  VirtualizerNode,
} from "../utils/virtualizer-layout";
import type { LayoutInfo, VirtualizerKey } from "../utils/virtualizer-layout-info";
import type { ComputedRef } from "vue";

import { computed, shallowRef } from "vue";

import { Rect, Size } from "../utils/virtualizer-geometry";
import { overscannedRect } from "../utils/virtualizer-overscan";

/**
 * The virtualizer, ported from React Aria's `Virtualizer` and `useVirtualizerState`.
 *
 * It owns what the layout needs to be asked with — the container's size, the visible rectangle,
 * which keys must stay rendered — decides when the layout has to run again, and turns the layout
 * infos that come back into a tree of views the collection renders.
 *
 * Two pieces of upstream are deliberately gone:
 *
 * `ReusableView` as a class. Its idea is kept — see {@link VirtualizerView.slot} — because a
 * keyed `v-for` on its own cannot spare a window that moved wholesale: every key in it is new, so
 * every row mounts anew, and a scrollbar dragged across a long collection lands on nothing for as
 * long as the mounting takes. Reordering is not deferred as React defers it: the rendered set is
 * kept in collection order at every moment, which is what a screen reader walks, and moving an
 * element is cheap next to mounting one.
 *
 * The scroll anchor. Upstream calls `UNSTABLE_getScrollAnchorInfo` on the layout, but no layout
 * implements it, so the whole tracker resolves to nothing for every collection in this build.
 */

/** One rendered element: a layout info, what it was built from, and anything nested inside it. */
export interface VirtualizerView {
  key: VirtualizerKey;
  /**
   * The element this view is rendered into, as a number that outlives the key.
   *
   * A key that leaves the window frees its slot, and the next key to arrive takes it. A collection
   * that keys its rendered items by this rather than by `key` keeps the element and its component
   * when the window moves and changes what they show — which is what makes a window that moved
   * wholesale cost a screenful of updates rather than a screenful of mounts.
   */
  slot: number;
  layoutInfo: LayoutInfo;
  parentKey: VirtualizerKey | null;
  node?: VirtualizerNode;
  children: VirtualizerView[];
}

/** The host as the virtualizer writes it. Layouts only ever read it. */
type MutableHost = {
  -readonly [Key in keyof VirtualizerLayoutHost]: VirtualizerLayoutHost[Key];
};

export interface UseVirtualizerOptions<Options extends object = object> {
  collection: () => VirtualizerCollection;
  /** The layout instance. Hold it in a `shallowRef`: a deep `ref` would proxy its caches. */
  layout: () => Layout<Options>;
  layoutOptions?: () => Options | undefined;
  /** Keys that stay rendered wherever they are, which in practice is the focused one. */
  persistedKeys?: () => Set<VirtualizerKey> | null | undefined;
}

export interface UseVirtualizerReturn {
  /** The root views, each carrying its own children. */
  visibleViews: ComputedRef<VirtualizerView[]>;
  contentSize: ComputedRef<Size>;
  visibleRect: ComputedRef<Rect>;
  size: ComputedRef<Size>;
  isScrolling: ComputedRef<boolean>;
  setVisibleRect: (rect: Rect) => void;
  setSize: (size: Size) => void;
  startScrolling: () => void;
  endScrolling: () => void;
  /** Records a measured size, and lays out again when it moved anything. */
  updateItemSize: (key: VirtualizerKey, size: Size) => void;
  /**
   * How far the content under the window has been pushed by rows measured above it.
   *
   * Adding this to the scroll offset is what holds the collection still while the rows above it
   * settle. Nothing here applies it — only whoever owns the scrolling element can.
   */
  scrollAdjustment: ComputedRef<number>;
  /** Reads the accumulated shift and clears it, so it is applied once. */
  takeScrollAdjustment: () => number;
  getLayoutInfo: (key: VirtualizerKey) => LayoutInfo | null;
  isPersistedKey: (key: VirtualizerKey) => boolean;
}

/** What the layout is compared against to decide whether it has to run again. */
interface LayoutPass<Options extends object> {
  collection: VirtualizerCollection | null;
  layout: Layout<Options> | null;
  layoutOptions: Options | undefined;
  rect: Rect;
  size: Size;
}

export const useVirtualizer = <Options extends object = object>(
  options: UseVirtualizerOptions<Options>,
): UseVirtualizerReturn => {
  const visibleRect = shallowRef(new Rect());
  const size = shallowRef(new Size());
  const isScrolling = shallowRef(false);
  /** Bumped when something outside the reactive inputs invalidates the layout. */
  const revision = shallowRef(0);
  const scrollAdjustment = shallowRef(0);

  const persistedKeys = () => options.persistedKeys?.() ?? new Set<VirtualizerKey>();

  /**
   * Whether a key, or anything containing it, must stay rendered.
   *
   * Ancestors count: a persisted cell whose row is out of view still needs the row, or it has
   * nowhere to live.
   */
  const isPersistedKey = (key: VirtualizerKey): boolean => {
    const keys = persistedKeys();

    if (keys.has(key)) return true;

    for (const persisted of keys) {
      let current: VirtualizerKey | null = persisted;

      while (current != null) {
        const layoutInfo: LayoutInfo | null = attachedLayout?.getLayoutInfo(current) ?? null;

        if (!layoutInfo?.parentKey) break;

        current = layoutInfo.parentKey;

        if (current === key) return true;
      }
    }

    return false;
  };

  // Plain object rather than reactive state: the layout reads it while it runs, and making these
  // reactive would mean writing to reactive state from inside a computed.
  const host: MutableHost = {
    collection: options.collection(),
    isPersistedKey,
    persistedKeys: persistedKeys(),
    size: size.value,
    visibleRect: visibleRect.value,
  };

  /** The layout currently attached to the host, needed by the ancestor walk above. */
  let attachedLayout: Layout<Options> | null = null;

  const lastPass: LayoutPass<Options> = {
    collection: null,
    layout: null,
    layoutOptions: undefined,
    rect: new Rect(),
    size: new Size(),
  };

  /** Set by `updateItemSize`, consumed by the next pass. */
  let pendingItemSizeChange = false;

  const pass = computed(() => {
    void revision.value;

    const collection = options.collection();
    const layout = options.layout();
    const layoutOptions = options.layoutOptions?.();
    const rect = visibleRect.value;
    const containerSize = size.value;

    host.collection = collection;
    host.persistedKeys = persistedKeys();
    host.size = containerSize;
    host.visibleRect = rect;

    let needsLayout = false;

    if (layout.host !== host) {
      layout.host = host;
      needsLayout = true;
    }

    attachedLayout = layout;

    if (collection !== lastPass.collection || layout !== lastPass.layout) needsLayout = true;

    const context: InvalidationContext<Options> = {
      contentChanged: collection !== lastPass.collection,
      itemSizeChanged: pendingItemSizeChange,
      layoutOptions,
    };

    // A scroll only needs a fresh layout when the layout says so — a stack does not care where
    // the viewport is, while anything positioned against the scroll offset does.
    if (!rect.pointEquals(lastPass.rect) || !containerSize.equals(lastPass.size)) {
      const oldRect = new Rect(
        lastPass.rect.x,
        lastPass.rect.y,
        lastPass.size.width,
        lastPass.size.height,
      );
      const newRect = new Rect(rect.x, rect.y, containerSize.width, containerSize.height);

      if (layout.shouldInvalidate(newRect, oldRect)) {
        context.offsetChanged = !rect.pointEquals(lastPass.rect);
        context.sizeChanged = !containerSize.equals(lastPass.size);
        needsLayout = true;
      }
    }

    if (
      lastPass.layoutOptions != null &&
      layoutOptions != null &&
      layoutOptions !== lastPass.layoutOptions &&
      layout.shouldInvalidateLayoutOptions(layoutOptions, lastPass.layoutOptions)
    ) {
      needsLayout = true;
    }

    if (pendingItemSizeChange) needsLayout = true;

    if (needsLayout) layout.update(context);

    pendingItemSizeChange = false;
    lastPass.collection = collection;
    lastPass.layout = layout;
    lastPass.layoutOptions = layoutOptions;
    lastPass.rect = rect;
    lastPass.size = containerSize;

    const contentSize = layout.getContentSize();
    const layoutInfos = layout.getVisibleLayoutInfos(overscannedRect(rect));

    return { contentSize, layout, layoutInfos };
  });

  /** Which slot each key of the last pass held. Plain state: it is history, not something derived. */
  let slotByKey = new Map<VirtualizerKey, number>();
  let nextSlot = 0;

  /**
   * Hands every key in the pass a slot, keeping the one it had.
   *
   * The slots of the keys that left are handed out in the order their keys were rendered, to the
   * arriving keys in the order they will be: a window that moved wholesale therefore keeps every
   * slot in place, and a window that moved by a row moves one element.
   */
  const assignSlots = (layoutInfos: LayoutInfo[]): Map<VirtualizerKey, number> => {
    const next = new Map<VirtualizerKey, number>();
    const arriving: VirtualizerKey[] = [];

    for (const { key } of layoutInfos) {
      const slot = slotByKey.get(key);

      if (slot == null) arriving.push(key);
      else next.set(key, slot);
    }

    const freed: number[] = [];

    for (const [key, slot] of slotByKey) {
      if (!next.has(key)) freed.push(slot);
    }

    for (const key of arriving) next.set(key, freed.length > 0 ? freed.shift()! : nextSlot++);

    slotByKey = next;

    return next;
  };

  /**
   * The layout infos arrive parents first, so a child always finds its parent already built. One
   * whose parent is not in the window is treated as a root rather than dropped — losing it would
   * take a persisted key out of the DOM, which is the one thing persisting it was for.
   */
  const visibleViews = computed<VirtualizerView[]>(() => {
    const { layoutInfos } = pass.value;
    const collection = options.collection();
    const views = new Map<VirtualizerKey, VirtualizerView>();
    const roots: VirtualizerView[] = [];
    const slots = assignSlots(layoutInfos);

    for (const layoutInfo of layoutInfos) {
      const view: VirtualizerView = {
        children: [],
        key: layoutInfo.key,
        layoutInfo,
        node: collection.getNode(layoutInfo.key),
        parentKey: layoutInfo.parentKey,
        slot: slots.get(layoutInfo.key)!,
      };

      views.set(view.key, view);

      const parent = layoutInfo.parentKey != null ? views.get(layoutInfo.parentKey) : undefined;

      if (parent) parent.children.push(view);
      else roots.push(view);
    }

    return roots;
  });

  return {
    contentSize: computed(() => pass.value.contentSize),
    endScrolling: () => {
      isScrolling.value = false;
    },
    getLayoutInfo: (key) => pass.value.layout.getLayoutInfo(key),
    isPersistedKey,
    isScrolling: computed(() => isScrolling.value),
    scrollAdjustment: computed(() => scrollAdjustment.value),
    setSize: (next) => {
      if (!size.value.equals(next)) size.value = next;
    },
    setVisibleRect: (rect) => {
      if (visibleRect.value.equals(rect)) return;

      visibleRect.value = rect;
    },
    size: computed(() => size.value),
    startScrolling: () => {
      isScrolling.value = true;
    },
    takeScrollAdjustment: () => {
      const pending = scrollAdjustment.value;

      scrollAdjustment.value = 0;

      return pending;
    },
    updateItemSize: (key, measured) => {
      // The attached layout rather than `pass.value.layout`: reading the pass here would run a
      // whole layout for every element measured, because the bump below is what makes the pass
      // stale and the next element's measurement is what reads it again. A screenful of rows
      // measuring in one flush would cost a screenful of layouts.
      // Falls back to the pass only when nothing has read it yet, which a rendered element
      // measuring itself always has.
      const layout = attachedLayout ?? pass.value.layout;

      const placed = layout.getLayoutInfo(key)?.rect;

      if (!layout.updateItemSize?.(key, measured)) return;

      // A row that changed height above the window pushed everything below it, the window's own
      // content included. Held here rather than applied: this composable does not own the element
      // that scrolls.
      if (placed != null && placed.y < visibleRect.value.y) {
        scrollAdjustment.value += measured.height - placed.height;
      }

      pendingItemSizeChange = true;
      revision.value += 1;
    },
    visibleRect: computed(() => visibleRect.value),
    visibleViews,
  };
};
