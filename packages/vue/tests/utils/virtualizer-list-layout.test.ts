import type {VirtualizerCollection, VirtualizerLayoutHost} from "@/utils/virtualizer-layout";
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

const attach = <O extends object>(layout: ListLayout<O>, host: VirtualizerLayoutHost) => {
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
