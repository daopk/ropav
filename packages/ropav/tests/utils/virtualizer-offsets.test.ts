import { describe, expect, it } from "vitest";

import { RowOffsets } from "@/utils/virtualizer-offsets";

interface Options {
  count?: number;
  estimate?: (index: number) => number;
  gap?: number;
  start?: number;
}

const offsets = (options: Options = {}) => {
  const index = new RowOffsets();

  index.configure({
    count: options.count ?? 1000,
    estimate: options.estimate ?? (() => 50),
    gap: options.gap ?? 0,
    keyAt: (position) => `row-${position}`,
    start: options.start ?? 0,
  });

  return index;
};

describe("RowOffsets", () => {
  describe("where a row sits", () => {
    it("stacks every row on the one above it", () => {
      const index = offsets();

      expect(index.startOf(0)).toBe(0);
      expect(index.startOf(1)).toBe(50);
      expect(index.startOf(999)).toBe(49_950);
      expect(index.endOf(999)).toBe(50_000);
    });

    it("answers for a row nothing has ever rendered", () => {
      const index = offsets({ count: 100_000 });

      // The whole point: no walk, no region, no cache to have reached this row first.
      expect(index.startOf(99_999)).toBe(4_999_950);
    });

    it("puts the gap between rows and not after the last", () => {
      const index = offsets({ count: 3, gap: 10, start: 4 });

      expect(index.startOf(0)).toBe(4);
      expect(index.startOf(1)).toBe(64);
      expect(index.startOf(2)).toBe(124);
      expect(index.total()).toBe(174);
    });

    it("takes a height that varies with the row", () => {
      const index = offsets({ count: 4, estimate: (position) => (position % 2 === 0 ? 20 : 60) });

      expect([0, 1, 2, 3].map((position) => index.startOf(position))).toEqual([0, 20, 80, 100]);
      expect(index.total()).toBe(160);
    });

    it("has nothing but its own origin when the collection is empty", () => {
      const index = offsets({ count: 0, start: 4 });

      expect(index.total()).toBe(4);
      expect(index.rangeFor(0, 400)).toEqual({ first: 0, last: -1 });
    });
  });

  describe("finding the row at an offset", () => {
    it("names the row whose band the offset falls in", () => {
      const index = offsets();

      expect(index.indexAt(0)).toBe(0);
      expect(index.indexAt(49)).toBe(0);
      expect(index.indexAt(20_000)).toBe(400);
      expect(index.indexAt(20_049)).toBe(400);
    });

    it("counts a row ending exactly on the offset as being above it", () => {
      const index = offsets();

      // A window snapped to a row boundary would otherwise take in the row above it, every time.
      expect(index.indexAt(50)).toBe(1);
    });

    it("names the row below a gap the offset lands in", () => {
      const index = offsets({ count: 10, gap: 10 });

      expect(index.indexAt(55)).toBe(1);
    });

    it("clamps to the collection rather than naming a row that is not there", () => {
      const index = offsets({ count: 10 });

      expect(index.indexAt(-100)).toBe(0);
      expect(index.indexAt(999_999)).toBe(9);
    });
  });

  describe("the rows a window covers", () => {
    it("covers the window edge to edge", () => {
      const index = offsets();
      const { first, last } = index.rangeFor(1_000, 400);

      expect(index.startOf(first)).toBeLessThanOrEqual(1_000);
      expect(index.endOf(last)).toBeGreaterThanOrEqual(1_400);
      expect(first).toBe(20);
      // Row 28 starts exactly on the bottom edge, which counts as inside the window; row 19 ends
      // exactly on the top edge, which counts as above it.
      expect(last).toBe(28);
    });

    it("costs the same wherever the window lands", () => {
      const index = offsets({ count: 100_000 });

      for (const offset of [0, 1_000, 500_000, 4_999_000]) {
        const { first, last } = index.rangeFor(offset, 400);

        expect(last - first).toBeLessThan(12);
        expect(index.endOf(last)).toBeGreaterThanOrEqual(Math.min(offset + 400, index.total()));
      }
    });

    it("adds the overscan either side without leaving the collection", () => {
      const index = offsets({ count: 10 });

      expect(index.rangeFor(0, 100, 3)).toEqual({ first: 0, last: 5 });
      expect(index.rangeFor(450, 100, 3)).toEqual({ first: 6, last: 9 });
      expect(index.rangeFor(200, 100)).toEqual({ first: 4, last: 6 });
    });

    it("comes back with rows for a window that outran the data", () => {
      const index = offsets({ count: 4 });
      const { first, last } = index.rangeFor(20_000, 400);

      // The offset a filter leaves a scrolled collection at. Naming the nearest rows is what lets
      // the next pass render something instead of nothing.
      expect(first).toBe(3);
      expect(last).toBe(3);
    });
  });

  describe("a measured row", () => {
    it("moves the rows below it and leaves the rows above alone", () => {
      const index = offsets({ count: 10 });

      expect(index.measure("row-2", 120, 2)).toBe(true);
      expect(index.startOf(1)).toBe(50);
      expect(index.startOf(2)).toBe(100);
      expect(index.startOf(3)).toBe(220);
      expect(index.total()).toBe(570);
    });

    it("reports a measurement that changed nothing", () => {
      const index = offsets({ count: 10 });

      expect(index.measure("row-2", 120, 2)).toBe(true);
      // Measuring the same height again moves nothing, which is what keeps measurement from
      // looping through the layout and back.
      expect(index.measure("row-2", 120, 2)).toBe(false);
    });

    it("is found by a search at its new offset", () => {
      const index = offsets({ count: 10 });

      index.measure("row-0", 500, 0);

      expect(index.indexAt(250)).toBe(0);
      expect(index.indexAt(500)).toBe(1);
    });

    it("says which rows are still guesses", () => {
      const index = offsets({ count: 10 });

      index.measure("row-2", 120, 2);

      expect(index.isMeasured(2)).toBe(true);
      expect(index.isMeasured(3)).toBe(false);
    });

    it("keeps its measurement when the window leaves it and comes back", () => {
      const index = offsets({ count: 1000 });

      index.measure("row-1", 120, 1);
      index.rangeFor(40_000, 400);

      // Held by key rather than by index, and never pruned by a window: a row that scrolled away
      // and back would otherwise be placed at an estimate again for a frame.
      expect(index.isMeasured(1)).toBe(true);
      expect(index.size(1)).toBe(120);
    });

    it("forgets everything when the container resizes", () => {
      const index = offsets({ count: 10 });

      index.measure("row-2", 120, 2);
      index.reset();

      // A row's height follows its width, so a resize makes every measurement a guess again.
      expect(index.isMeasured(2)).toBe(false);
      expect(index.total()).toBe(500);
    });
  });

  describe("a collection that changed under it", () => {
    const reconfigure = (index: RowOffsets, count: number, collection: unknown) => {
      index.configure({
        collection,
        count,
        estimate: () => 50,
        keyAt: (position) => `row-${position}`,
      });
    };

    it("reports a total the new data explains", () => {
      const index = offsets({ count: 1000 });

      index.rangeFor(20_000, 400);
      reconfigure(index, 4, {});

      expect(index.total()).toBe(200);
    });

    it("re-adds the rows when the keys moved under an unchanged count", () => {
      const index = new RowOffsets();
      const first = {};

      index.configure({
        collection: first,
        count: 3,
        estimate: () => 50,
        keyAt: (position) => `row-${position}`,
      });
      index.measure("row-0", 200, 0);

      expect(index.total()).toBe(300);

      // Same length, different rows. A size held by key would otherwise be read for whichever row
      // now sits at that index.
      index.configure({
        collection: {},
        count: 3,
        estimate: () => 50,
        keyAt: (position) => `other-${position}`,
      });

      expect(index.total()).toBe(150);
    });
  });
});
