import type { DropTarget } from "@/utils/dnd-types";
import type {
  VirtualizerCollection,
  VirtualizerLayoutHost,
  VirtualizerNode,
} from "@/utils/virtualizer-layout";
import type { VirtualizerKey } from "@/utils/virtualizer-layout-info";

import { describe, expect, it } from "vitest";

import { createListCollection } from "@/utils/virtualizer-collection";
import { Rect, Size } from "@/utils/virtualizer-geometry";
import { ListLayout } from "@/utils/virtualizer-list-layout";

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}` }));

interface HostOptions {
  collection?: VirtualizerCollection;
  itemCount?: number;
  persistedKeys?: VirtualizerKey[];
  size?: Size;
  visibleRect?: Rect;
}

/** Stands in for the virtualizer, which is what owns the container's measurements. */
const createHost = (options: HostOptions = {}): VirtualizerLayoutHost => {
  const persistedKeys = new Set(options.persistedKeys ?? []);

  return {
    collection:
      options.collection ?? createListCollection({ items: makeItems(options.itemCount ?? 0) }),
    isPersistedKey: (key) => persistedKeys.has(key),
    persistedKeys,
    size: options.size ?? new Size(300, 400),
    visibleRect: options.visibleRect ?? new Rect(0, 0, 300, 400),
  };
};

const attach = <L extends ListLayout>(layout: L, host: VirtualizerLayoutHost): L => {
  layout.host = host;
  layout.update({});

  return layout;
};

const keysIn = (layout: ListLayout, rect: Rect) =>
  layout.getVisibleLayoutInfos(rect).map((layoutInfo) => layoutInfo.key);

describe("ListLayout", () => {
  describe("content size", () => {
    it("stacks fixed rows and takes its width from the container", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

      // 1000 rows of 50px, no gap and no padding.
      expect(layout.getContentSize()).toEqual(new Size(300, 50_000));
      expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(0, 0, 300, 50));
      expect(layout.getLayoutInfo("item-999")?.rect).toEqual(new Rect(0, 49_950, 300, 50));
    });

    it("insets by the padding and puts the gap only between rows", () => {
      const layout = attach(
        new ListLayout({ gap: 10, padding: 4, rowSize: 50 }),
        createHost({ itemCount: 3 }),
      );

      expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(4, 4, 292, 50));
      expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(4, 64, 292, 50));
      expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(4, 124, 292, 50));
      // 4 + 3 rows of 60, less the gap after the last row, plus the bottom padding.
      expect(layout.getContentSize()).toEqual(new Size(300, 178));
    });

    it("has no size and no padding when the collection is empty", () => {
      const layout = attach(
        new ListLayout({ padding: 4, rowSize: 50 }),
        createHost({ itemCount: 0 }),
      );

      expect(layout.getContentSize()).toEqual(new Size(300, 0));
      expect(layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400))).toEqual([]);
    });
  });

  describe("row size", () => {
    it("marks a row estimated when only an estimate was given", () => {
      const layout = attach(new ListLayout({ estimatedRowSize: 40 }), createHost({ itemCount: 2 }));

      expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(40);
      expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(true);
    });

    it("does not mark a fixed row estimated", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 2 }));

      expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(false);
    });

    it("falls back to React Aria's 48px when neither size is given", () => {
      const layout = attach(new ListLayout(), createHost({ itemCount: 2 }));

      expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(0, 48, 300, 48));
    });

    it("takes new options on the next update", () => {
      const host = createHost({ itemCount: 10 });
      const layout = attach(new ListLayout({ rowSize: 50 }), host);

      layout.update({ layoutOptions: { rowSize: 20 } });

      expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(0, 40, 300, 20));
      expect(layout.getContentSize()).toEqual(new Size(300, 200));
    });
  });

  describe("visible layout infos", () => {
    it("returns the rows the rectangle covers, including the one it only touches", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

      // 400px of viewport is 8 whole rows; the row starting exactly at 400 touches the edge and
      // counts, matching React Aria's inclusive comparison.
      expect(keysIn(layout, new Rect(0, 0, 300, 400))).toEqual([
        "item-0",
        "item-1",
        "item-2",
        "item-3",
        "item-4",
        "item-5",
        "item-6",
        "item-7",
        "item-8",
      ]);
    });

    it("grows the rectangle to whole rows so a scroll within one row does not churn", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

      // Anywhere inside row 2 the rectangle snaps to the same 100..550: y floors to 100 and the
      // height grows to cover what the floor gave away. Every offset in that row renders the
      // same eleven rows, so scrolling a pixel at a time mounts nothing and unmounts nothing.
      const insideRowTwo = Array.from({ length: 11 }, (_, index) => `item-${index + 1}`);

      expect(keysIn(layout, new Rect(0, 101, 300, 400))).toEqual(insideRowTwo);
      expect(keysIn(layout, new Rect(0, 137, 300, 400))).toEqual(insideRowTwo);
      expect(keysIn(layout, new Rect(0, 149, 300, 400))).toEqual(insideRowTwo);

      // Landing exactly on a row boundary needs one row fewer, since nothing was given away.
      expect(keysIn(layout, new Rect(0, 100, 300, 400))).toEqual(insideRowTwo.slice(0, 10));
      // The set only ever slides by whole rows: the next row down starts one key later.
      expect(keysIn(layout, new Rect(0, 151, 300, 400))).toEqual(
        Array.from({ length: 11 }, (_, index) => `item-${index + 2}`),
      );
    });

    it("returns nothing for an unmeasured rectangle", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

      // The guard React Aria drops in tests: a container with no height shows no rows.
      expect(keysIn(layout, new Rect(0, 0, 300, 0))).toEqual([]);
    });

    it("keeps a persisted key in the window from far outside it", () => {
      const layout = attach(
        new ListLayout({ rowSize: 50 }),
        createHost({ itemCount: 1000, persistedKeys: ["item-900"] }),
      );

      // The roving tab stop lives on the focused row; losing its element drops focus outright.
      expect(keysIn(layout, new Rect(0, 0, 300, 400))).toContain("item-900");
    });
  });

  describe("node types", () => {
    it("sizes a loader by its own option", () => {
      const collection = createListCollection({ items: makeItems(1), type: "loader" });
      const layout = attach(
        new ListLayout({ loaderSize: 30, rowSize: 50 }),
        createHost({ collection }),
      );

      expect(layout.getLayoutInfo("item-0")?.rect.height).toBe(30);
      // A loader is in the window wherever it sits, so a pending page keeps its sentinel.
      expect(keysIn(layout, new Rect(0, 10_000, 300, 400))).toEqual(["item-0"]);
    });

    it("refuses a node type it cannot place", () => {
      const collection = createListCollection({ items: makeItems(1), type: "section" });

      expect(() => attach(new ListLayout(), createHost({ collection }))).toThrow(
        "Unsupported node type: section",
      );
    });
  });

  it("lets every row spill outside its own box", () => {
    const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 3 }));

    // The wrapper is sized by the layout; a focus ring drawn inside it is not.
    expect(layout.getLayoutInfo("item-0")?.allowOverflow).toBe(true);
  });
});

/** Counts the rows actually placed, which is the only way to observe laziness from outside. */
class CountingListLayout extends ListLayout {
  built: VirtualizerKey[] = [];

  /** How many rows are held in the cache right now, which is what pruning is observed by. */
  get cachedKeys(): VirtualizerKey[] {
    return [...this.layoutNodes.keys()];
  }

  protected override buildItem(node: VirtualizerNode, x: number, y: number) {
    this.built.push(node.key);

    return super.buildItem(node, x, y);
  }
}

describe("ListLayout laziness", () => {
  it("places a screenful rather than the whole collection", () => {
    const layout = attach(new CountingListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

    // One row is placed to learn the stride; the other 999 are accounted for arithmetically,
    // which is why the scrollbar is right without a thousand rects existing.
    expect(new Set(layout.built)).toEqual(new Set(["item-0"]));
    expect(layout.getContentSize()).toEqual(new Size(300, 50_000));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));

    // The window asked about, and nothing below it.
    expect(new Set(layout.built)).toEqual(
      new Set(Array.from({ length: 9 }, (_, index) => `item-${index}`)),
    );
  });

  it("moves the placed region with the window rather than growing to cover both", () => {
    const layout = attach(new CountingListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));
    layout.built.length = 0;
    layout.getVisibleLayoutInfos(new Rect(0, 500, 300, 400));

    // A fixed stride puts every row at a known offset, so the rows above the window are not
    // needed to know where the ones inside it sit. Only the new window is placed.
    expect(new Set(layout.built)).toEqual(
      new Set(Array.from({ length: 10 }, (_, index) => `item-${index + 9}`)),
    );
  });

  it("drops the rows the window has left behind", () => {
    const layout = attach(new CountingListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));
    layout.getVisibleLayoutInfos(new Rect(0, 20_000, 300, 400));

    // Scrolling the length of a long collection used to leave a layout node per row behind it.
    expect(layout.cachedKeys).not.toContain("item-0");
    expect(layout.cachedKeys).toContain("item-400");
    expect(layout.cachedKeys.length).toBeLessThan(20);
  });

  it("keeps a persisted row placed once the window has moved past it", () => {
    const layout = attach(
      new CountingListLayout({ rowSize: 50 }),
      createHost({ itemCount: 1000, persistedKeys: ["item-0"] }),
    );

    layout.getVisibleLayoutInfos(new Rect(0, 20_000, 300, 400));

    // The roving tab stop lives on the focused row, so pruning it would drop focus outright.
    expect(layout.cachedKeys).toContain("item-0");
    expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(0, 0, 300, 50));
  });

  it("places one row rather than the whole collection when asked about a key by index", () => {
    const layout = attach(new CountingListLayout({ rowSize: 50 }), createHost({ itemCount: 1000 }));

    layout.built.length = 0;

    // What pressing End does. With a fixed stride the offset is a multiplication, so the row is
    // placed on its own rather than by laying out everything above it.
    expect(layout.getLayoutInfo("item-999")?.rect).toEqual(new Rect(0, 49_950, 300, 50));
    expect(layout.built).toEqual(["item-999"]);
  });

  it("lays out everything above a key it never reached when rows vary in height", () => {
    const layout = attach(
      new CountingListLayout({ estimatedRowSize: 50 }),
      createHost({ itemCount: 1000 }),
    );

    layout.built.length = 0;

    // A measured row can be any height, so there is no way to know where this one sits without
    // adding up the rows above it.
    expect(layout.getLayoutInfo("item-999")?.rect).toEqual(new Rect(0, 49_950, 300, 50));
    expect(new Set(layout.built).size).toBe(1000);
  });
});

describe("ListLayout measured rows", () => {
  const measuredLayout = () => {
    const layout = attach(new ListLayout({ estimatedRowSize: 40 }), createHost({ itemCount: 100 }));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));

    return layout;
  };

  it("reports whether a measurement moved anything", () => {
    const layout = measuredLayout();

    expect(layout.updateItemSize("item-1", new Size(300, 90))).toBe(true);
    // Measuring the same height again changes nothing, so the virtualizer is not asked to
    // lay out again — that is what keeps measurement from looping.
    expect(layout.updateItemSize("item-1", new Size(300, 90))).toBe(false);
    expect(layout.updateItemSize("nobody", new Size(300, 90))).toBe(false);
  });

  it("stops calling a row estimated once it has been measured", () => {
    const layout = measuredLayout();

    expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(true);

    layout.updateItemSize("item-1", new Size(300, 90));

    expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(false);
    expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(90);
  });

  it("moves the rows below a measured row, and keeps the measurement", () => {
    const layout = measuredLayout();

    layout.updateItemSize("item-1", new Size(300, 90));
    layout.update({ itemSizeChanged: true });

    expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(0, 0, 300, 40));
    expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(0, 40, 300, 90));
    // 40 + 90 rather than 40 + 40: the row below sits under the measurement, not the estimate.
    expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(0, 130, 300, 40));
  });

  it("throws the measurement away when the container resizes", () => {
    const layout = measuredLayout();

    layout.updateItemSize("item-1", new Size(300, 90));
    layout.update({ sizeChanged: true });

    // A row's height depends on its width, so a resize makes every measurement a guess again.
    expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(40);
    expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(true);
  });

  it("knows which option changes require a fresh layout", () => {
    const layout = new ListLayout({ rowSize: 50 });

    expect(layout.shouldInvalidateLayoutOptions({ rowSize: 50 }, { rowSize: 50 })).toBe(false);
    expect(layout.shouldInvalidateLayoutOptions({ rowSize: 60 }, { rowSize: 50 })).toBe(true);
    expect(layout.shouldInvalidateLayoutOptions({ gap: 4 }, {})).toBe(true);
  });
  /**
   * Resolving a drop from a point, which is the whole reason a layout can be a drop delegate.
   *
   * The DOM-based delegate searches for elements, and outside the window there are none — so
   * every case below uses a point over a row nobody has scrolled to, which is exactly what it
   * cannot answer.
   */
  describe("drop targets", () => {
    const dropLayout = (options: { scrollTop?: number; itemCount?: number } = {}) =>
      attach(
        new ListLayout({ rowSize: 50 }),
        createHost({
          itemCount: options.itemCount ?? 1000,
          visibleRect: new Rect(0, options.scrollTop ?? 0, 300, 400),
        }),
      );

    const anything = () => true;
    /** What a reorder-only collection allows: between rows, never onto one. */
    const gapsOnly = (target: DropTarget) => target.type === "item" && target.dropPosition !== "on";

    it("answers for a row far outside the window", () => {
      const layout = dropLayout({ scrollTop: 25_000 });

      // 25 000 / 50 is row 500, and the point is 20px into it.
      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({
        dropPosition: "on",
        key: "item-500",
        type: "item",
      });
    });

    // The same offset means a different row at every scroll position, which is the one thing a
    // DOM search gets right for free and arithmetic has to be told.
    it("moves with the scroll offset", () => {
      const keys = [0, 1_000, 5_000, 25_000, 49_600].map((scrollTop) => {
        const target = dropLayout({ scrollTop }).getDropTargetFromPoint(10, 20, anything);

        return target?.type === "item" ? target.key : null;
      });

      expect(keys).toEqual(["item-0", "item-20", "item-100", "item-500", "item-992"]);
    });

    // Dropping onto a row wins the middle; the outer 10px still belong to the gaps.
    it("keeps the edges for the gaps when dropping on a row is allowed", () => {
      const layout = dropLayout();

      expect(layout.getDropTargetFromPoint(10, 4, anything)).toMatchObject({
        dropPosition: "before",
        key: "item-0",
      });
      expect(layout.getDropTargetFromPoint(10, 46, anything)).toMatchObject({
        dropPosition: "after",
        key: "item-0",
      });
      expect(layout.getDropTargetFromPoint(10, 25, anything)).toMatchObject({
        dropPosition: "on",
        key: "item-0",
      });
    });

    // With nowhere to drop on, the row splits down the middle so every pixel resolves.
    it("splits the row in half when dropping on it is refused", () => {
      const layout = dropLayout();

      expect(layout.getDropTargetFromPoint(10, 20, gapsOnly)).toMatchObject({
        dropPosition: "before",
        key: "item-0",
      });
      expect(layout.getDropTargetFromPoint(10, 30, gapsOnly)).toMatchObject({
        dropPosition: "after",
        key: "item-0",
      });
    });

    it("falls back to the whole collection when there is nothing to drop near", () => {
      const layout = attach(new ListLayout({ rowSize: 50 }), createHost({ itemCount: 0 }));

      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({ type: "root" });
    });

    /**
     * The indicator straddles the boundary rather than sitting under it, so a 2px line lands
     * *on* the edge instead of pushing the rows apart.
     */
    it("places a gap indicator across the boundary", () => {
      const layout = dropLayout();

      expect(
        layout.getDropTargetLayoutInfo({ dropPosition: "before", key: "item-4", type: "item" })
          .rect,
      ).toEqual(new Rect(0, 199, 300, 2));
      expect(
        layout.getDropTargetLayoutInfo({ dropPosition: "after", key: "item-4", type: "item" }).rect,
      ).toEqual(new Rect(0, 249, 300, 2));
    });

    // The very first gap has nothing above it to straddle into.
    it("keeps the first indicator inside the content", () => {
      const layout = dropLayout();
      const info = layout.getDropTargetLayoutInfo({
        dropPosition: "before",
        key: "item-0",
        type: "item",
      });

      expect(info.rect.y).toBe(0);
    });

    // Dropping onto a row covers the row, which is what lets it be highlighted whole.
    it("covers the row when the drop lands on it", () => {
      const layout = dropLayout();

      expect(
        layout.getDropTargetLayoutInfo({ dropPosition: "on", key: "item-4", type: "item" }).rect,
      ).toEqual(new Rect(0, 200, 300, 50));
    });

    it("takes the thickness from the layout options", () => {
      const layout = attach(
        new ListLayout({ dropIndicatorThickness: 8, rowSize: 50 }),
        createHost({ itemCount: 10 }),
      );

      expect(
        layout.getDropTargetLayoutInfo({ dropPosition: "before", key: "item-4", type: "item" })
          .rect,
      ).toEqual(new Rect(0, 196, 300, 8));
    });
  });
});

/**
 * A collection that shrinks under a window scrolled past its new end.
 *
 * This is what a client-side filter does to a virtualized listbox: the window is left describing
 * an offset the data no longer reaches. The content size has to come back as a function of the
 * data, because the browser clamps `scrollTop` against the height the wrapper reports — so a
 * content size derived from the stale offset is a fixed point that nothing can scroll out of.
 */
describe("ListLayout under a shrinking collection", () => {
  const shrink = (layout: ListLayout, host: VirtualizerLayoutHost, itemCount: number) => {
    (host as { collection: VirtualizerCollection }).collection = createListCollection({
      items: makeItems(itemCount),
    });
    layout.update({ contentChanged: true });
  };

  it("reports a content size the data explains, not the offset it was left at", () => {
    const host = createHost({ itemCount: 1000 });
    const layout = attach(new ListLayout({ rowSize: 50 }), host);

    layout.getVisibleLayoutInfos(new Rect(0, 20_000, 300, 400));
    shrink(layout, host, 4);

    expect(layout.getContentSize()).toEqual(new Size(300, 200));
  });

  it("comes back with rows once the height it reports has clamped the offset", () => {
    const host = createHost({ itemCount: 1000 });
    const layout = attach(new ListLayout({ rowSize: 50 }), host);

    layout.getVisibleLayoutInfos(new Rect(0, 20_000, 300, 400));
    shrink(layout, host, 4);

    // Nothing re-runs on its own. The wrapper reports a height, the browser clamps `scrollTop`
    // against it, and only the moved offset asks for a layout again — so a height that still
    // describes the old offset is a fixed point the collection never scrolls out of.
    const clamped = Math.max(0, layout.getContentSize().height - 400);

    expect(keysIn(layout, new Rect(0, clamped, 300, 400))).not.toEqual([]);
  });
});
