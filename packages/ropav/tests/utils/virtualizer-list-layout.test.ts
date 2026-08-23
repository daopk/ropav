import type {DropTarget} from "@/utils/dnd-types";
import type {
  VirtualizerCollection,
  VirtualizerLayoutHost,
  VirtualizerNode,
} from "@/utils/virtualizer-layout";
import type {VirtualizerKey} from "@/utils/virtualizer-layout-info";

import {describe, expect, it} from "vitest";

import {createListCollection} from "@/utils/virtualizer-collection";
import {Rect, Size} from "@/utils/virtualizer-geometry";
import {ListLayout} from "@/utils/virtualizer-list-layout";

const makeItems = (count: number) =>
  Array.from({length: count}, (_, index) => ({id: `item-${index}`, name: `Item ${index}`}));

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
      options.collection ?? createListCollection({items: makeItems(options.itemCount ?? 0)}),
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
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 1000}));

      // 1000 rows of 50px, no gap and no padding.
      expect(layout.getContentSize()).toEqual(new Size(300, 50_000));
      expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(0, 0, 300, 50));
      expect(layout.getLayoutInfo("item-999")?.rect).toEqual(new Rect(0, 49_950, 300, 50));
    });

    it("insets by the padding and puts the gap only between rows", () => {
      const layout = attach(
        new ListLayout({gap: 10, padding: 4, rowSize: 50}),
        createHost({itemCount: 3}),
      );

      expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(4, 4, 292, 50));
      expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(4, 64, 292, 50));
      expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(4, 124, 292, 50));
      // 4 + 3 rows of 60, less the gap after the last row, plus the bottom padding.
      expect(layout.getContentSize()).toEqual(new Size(300, 178));
    });

    it("has no size and no padding when the collection is empty", () => {
      const layout = attach(new ListLayout({padding: 4, rowSize: 50}), createHost({itemCount: 0}));

      expect(layout.getContentSize()).toEqual(new Size(300, 0));
      expect(layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400))).toEqual([]);
    });
  });

  describe("row size", () => {
    it("marks a row estimated when only an estimate was given", () => {
      const layout = attach(new ListLayout({estimatedRowSize: 40}), createHost({itemCount: 2}));

      expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(40);
      expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(true);
    });

    it("does not mark a fixed row estimated", () => {
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 2}));

      expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(false);
    });

    it("falls back to React Aria's 48px when neither size is given", () => {
      const layout = attach(new ListLayout(), createHost({itemCount: 2}));

      expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(0, 48, 300, 48));
    });

    it("takes new options on the next update", () => {
      const host = createHost({itemCount: 10});
      const layout = attach(new ListLayout({rowSize: 50}), host);

      layout.update({layoutOptions: {rowSize: 20}});

      expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(0, 40, 300, 20));
      expect(layout.getContentSize()).toEqual(new Size(300, 200));
    });

    it("accepts React Aria's deprecated rowHeight alias, which the stories still pass", () => {
      const layout = attach(new ListLayout({rowHeight: 50}), createHost({itemCount: 2}));

      expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(50);
    });
  });

  describe("visible layout infos", () => {
    it("returns the rows the rectangle covers, including the one it only touches", () => {
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 1000}));

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
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 1000}));

      // Anywhere inside row 2 the rectangle snaps to the same 100..550: y floors to 100 and the
      // height grows to cover what the floor gave away. Every offset in that row renders the
      // same eleven rows, so scrolling a pixel at a time mounts nothing and unmounts nothing.
      const insideRowTwo = Array.from({length: 11}, (_, index) => `item-${index + 1}`);

      expect(keysIn(layout, new Rect(0, 101, 300, 400))).toEqual(insideRowTwo);
      expect(keysIn(layout, new Rect(0, 137, 300, 400))).toEqual(insideRowTwo);
      expect(keysIn(layout, new Rect(0, 149, 300, 400))).toEqual(insideRowTwo);

      // Landing exactly on a row boundary needs one row fewer, since nothing was given away.
      expect(keysIn(layout, new Rect(0, 100, 300, 400))).toEqual(insideRowTwo.slice(0, 10));
      // The set only ever slides by whole rows: the next row down starts one key later.
      expect(keysIn(layout, new Rect(0, 151, 300, 400))).toEqual(
        Array.from({length: 11}, (_, index) => `item-${index + 2}`),
      );
    });

    it("returns nothing for an unmeasured rectangle", () => {
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 1000}));

      // The guard React Aria drops in tests: a container with no height shows no rows.
      expect(keysIn(layout, new Rect(0, 0, 300, 0))).toEqual([]);
    });

    it("keeps a persisted key in the window from far outside it", () => {
      const layout = attach(
        new ListLayout({rowSize: 50}),
        createHost({itemCount: 1000, persistedKeys: ["item-900"]}),
      );

      // The roving tab stop lives on the focused row; losing its element drops focus outright.
      expect(keysIn(layout, new Rect(0, 0, 300, 400))).toContain("item-900");
    });
  });

  describe("node types", () => {
    it("sizes a loader by its own option", () => {
      const collection = createListCollection({items: makeItems(1), type: "loader"});
      const layout = attach(
        new ListLayout({loaderSize: 30, rowSize: 50}),
        createHost({collection}),
      );

      expect(layout.getLayoutInfo("item-0")?.rect.height).toBe(30);
      // A loader is in the window wherever it sits, so a pending page keeps its sentinel.
      expect(keysIn(layout, new Rect(0, 10_000, 300, 400))).toEqual(["item-0"]);
    });

    it("refuses a node type it cannot place", () => {
      const collection = createListCollection({items: makeItems(1), type: "section"});

      expect(() => attach(new ListLayout(), createHost({collection}))).toThrow(
        "Unsupported node type: section",
      );
    });
  });

  it("lets every row spill outside its own box", () => {
    const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 3}));

    // The wrapper is sized by the layout; a focus ring drawn inside it is not.
    expect(layout.getLayoutInfo("item-0")?.allowOverflow).toBe(true);
  });
});

/** Counts the rows actually placed, which is the only way to observe laziness from outside. */
class CountingListLayout extends ListLayout {
  built: VirtualizerKey[] = [];

  protected override buildItem(node: VirtualizerNode, x: number, y: number) {
    this.built.push(node.key);

    return super.buildItem(node, x, y);
  }
}

describe("ListLayout laziness", () => {
  it("places a screenful rather than the whole collection", () => {
    const layout = attach(new CountingListLayout({rowSize: 50}), createHost({itemCount: 1000}));

    // One row is placed to learn the stride; the other 999 are accounted for arithmetically,
    // which is why the scrollbar is right without a thousand rects existing.
    expect(new Set(layout.built)).toEqual(new Set(["item-0"]));
    expect(layout.getContentSize()).toEqual(new Size(300, 50_000));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));

    // The window asked about, and nothing below it.
    expect(new Set(layout.built)).toEqual(
      new Set(Array.from({length: 9}, (_, index) => `item-${index}`)),
    );
  });

  it("grows the placed region as the window moves down, and never shrinks it", () => {
    const layout = attach(new CountingListLayout({rowSize: 50}), createHost({itemCount: 1000}));

    layout.getVisibleLayoutInfos(new Rect(0, 0, 300, 400));
    layout.getVisibleLayoutInfos(new Rect(0, 500, 300, 400));

    // The requested region is a union, so scrolling down extends it rather than moving it.
    // Rows above stay placed, which is what makes scrolling back up cost nothing.
    const placed = new Set(layout.built);

    expect(placed.has("item-0")).toBe(true);
    // The union reaches 900px, so row 18 is the last one placed and row 19 is still only counted.
    expect(placed.has("item-18")).toBe(true);
    expect(placed.has("item-19")).toBe(false);
  });

  it("skips the rows above the region after the container resizes mid-scroll", () => {
    const scrolled = createHost({itemCount: 1000, visibleRect: new Rect(0, 20_000, 300, 400)});
    const layout = attach(new CountingListLayout({rowSize: 50}), scrolled);

    layout.built.length = 0;
    // A resize is what drops the cache and re-anchors the region on what is on screen. Only
    // then can the layout skip: rows 0 to 398 are counted, not placed.
    layout.update({sizeChanged: true});
    layout.getVisibleLayoutInfos(scrolled.visibleRect);

    const placed = new Set(layout.built);

    expect(placed.has("item-100")).toBe(false);
    expect(placed.has("item-400")).toBe(true);
    expect(placed.size).toBeLessThan(20);
  });

  it("computes the whole layout when asked about a key it never reached", () => {
    const layout = attach(new CountingListLayout({rowSize: 50}), createHost({itemCount: 1000}));

    layout.built.length = 0;

    // What pressing End does: a key at an arbitrary offset, whose position cannot be known
    // without placing everything above it.
    expect(layout.getLayoutInfo("item-999")?.rect).toEqual(new Rect(0, 49_950, 300, 50));
    expect(new Set(layout.built).size).toBe(1000);
  });
});

describe("ListLayout measured rows", () => {
  const measuredLayout = () => {
    const layout = attach(new ListLayout({estimatedRowSize: 40}), createHost({itemCount: 100}));

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
    layout.update({itemSizeChanged: true});

    expect(layout.getLayoutInfo("item-0")?.rect).toEqual(new Rect(0, 0, 300, 40));
    expect(layout.getLayoutInfo("item-1")?.rect).toEqual(new Rect(0, 40, 300, 90));
    // 40 + 90 rather than 40 + 40: the row below sits under the measurement, not the estimate.
    expect(layout.getLayoutInfo("item-2")?.rect).toEqual(new Rect(0, 130, 300, 40));
  });

  it("throws the measurement away when the container resizes", () => {
    const layout = measuredLayout();

    layout.updateItemSize("item-1", new Size(300, 90));
    layout.update({sizeChanged: true});

    // A row's height depends on its width, so a resize makes every measurement a guess again.
    expect(layout.getLayoutInfo("item-1")?.rect.height).toBe(40);
    expect(layout.getLayoutInfo("item-1")?.estimatedSize).toBe(true);
  });

  it("knows which option changes require a fresh layout", () => {
    const layout = new ListLayout({rowSize: 50});

    expect(layout.shouldInvalidateLayoutOptions({rowSize: 50}, {rowSize: 50})).toBe(false);
    expect(layout.shouldInvalidateLayoutOptions({rowSize: 60}, {rowSize: 50})).toBe(true);
    expect(layout.shouldInvalidateLayoutOptions({gap: 4}, {})).toBe(true);
    // The deprecated alias has to compare against the current name, or a story that passes
    // `rowHeight` would look unchanged forever.
    expect(layout.shouldInvalidateLayoutOptions({rowSize: 50}, {rowHeight: 50})).toBe(false);
  });
  /**
   * Resolving a drop from a point, which is the whole reason a layout can be a drop delegate.
   *
   * The DOM-based delegate searches for elements, and outside the window there are none — so
   * every case below uses a point over a row nobody has scrolled to, which is exactly what it
   * cannot answer.
   */
  describe("drop targets", () => {
    const dropLayout = (options: {scrollTop?: number; itemCount?: number} = {}) =>
      attach(
        new ListLayout({rowSize: 50}),
        createHost({
          itemCount: options.itemCount ?? 1000,
          visibleRect: new Rect(0, options.scrollTop ?? 0, 300, 400),
        }),
      );

    const anything = () => true;
    /** What a reorder-only collection allows: between rows, never onto one. */
    const gapsOnly = (target: DropTarget) => target.type === "item" && target.dropPosition !== "on";

    it("answers for a row far outside the window", () => {
      const layout = dropLayout({scrollTop: 25_000});

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
        const target = dropLayout({scrollTop}).getDropTargetFromPoint(10, 20, anything);

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
      const layout = attach(new ListLayout({rowSize: 50}), createHost({itemCount: 0}));

      expect(layout.getDropTargetFromPoint(10, 20, anything)).toEqual({type: "root"});
    });

    /**
     * The indicator straddles the boundary rather than sitting under it, so a 2px line lands
     * *on* the edge instead of pushing the rows apart.
     */
    it("places a gap indicator across the boundary", () => {
      const layout = dropLayout();

      expect(
        layout.getDropTargetLayoutInfo({dropPosition: "before", key: "item-4", type: "item"}).rect,
      ).toEqual(new Rect(0, 199, 300, 2));
      expect(
        layout.getDropTargetLayoutInfo({dropPosition: "after", key: "item-4", type: "item"}).rect,
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
        layout.getDropTargetLayoutInfo({dropPosition: "on", key: "item-4", type: "item"}).rect,
      ).toEqual(new Rect(0, 200, 300, 50));
    });

    it("takes the thickness from the layout options", () => {
      const layout = attach(
        new ListLayout({dropIndicatorThickness: 8, rowSize: 50}),
        createHost({itemCount: 10}),
      );

      expect(
        layout.getDropTargetLayoutInfo({dropPosition: "before", key: "item-4", type: "item"}).rect,
      ).toEqual(new Rect(0, 196, 300, 8));
    });
  });
});
