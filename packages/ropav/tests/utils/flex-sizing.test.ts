import type { FlexSizeDefinition } from "@/utils/flex-sizing";

import { describe, expect, it } from "vitest";

import {
  calculateFlexSizes,
  getMaxSize,
  getMinSize,
  isStaticSize,
  parseFractionalUnit,
  parseStaticSize,
} from "@/utils/flex-sizing";

const sizes = (availableSize: number, definitions: FlexSizeDefinition[]) =>
  calculateFlexSizes(
    availableSize,
    definitions,
    () => "1fr",
    () => 75,
  );

describe("flex sizing", () => {
  describe("parsing a size", () => {
    it.each([
      [150, true],
      ["50%", true],
      ["240px", true],
      ["240", true],
      ["1fr", false],
      ["2fr", false],
      ["wide", false],
      [undefined, false],
    ])("treats %s as static: %s", (size, expected) => {
      expect(isStaticSize(size)).toBe(expected);
    });

    it("reads the number in front of fr", () => {
      expect(parseFractionalUnit("3fr")).toBe(3);
    });

    // React Aria warns and carries on rather than throwing, so an unrecognised size still lays out.
    it("falls back to one fraction for anything it cannot read", () => {
      expect(parseFractionalUnit("wide")).toBe(1);
      expect(parseFractionalUnit(200)).toBe(1);
    });

    it("resolves a percentage against the container size", () => {
      expect(parseStaticSize("25%", 800)).toBe(200);
    });

    // A template attribute is always a string, so these are the forms most callers can actually
    // write. Read as fractions they would silently lay out at `1fr` instead.
    it("reads pixels written as a string", () => {
      expect(parseStaticSize("240px", 800)).toBe(240);
      expect(parseStaticSize("240", 800)).toBe(240);
    });

    it("refuses a size that is neither pixels nor a percentage", () => {
      expect(() => parseStaticSize("1fr", 800)).toThrow(/percentages or numbers/);
    });

    it("leaves a missing minimum at zero and a missing maximum unbounded", () => {
      expect(getMinSize(undefined, 800)).toBe(0);
      expect(getMaxSize(undefined, 800)).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("dividing the container", () => {
    it("splits it evenly between equal fractions", () => {
      expect(sizes(1000, [{}, {}])).toEqual([500, 500]);
    });

    it("weights the split by each fraction", () => {
      expect(sizes(1000, [{ size: "3fr" }, { size: "1fr" }])).toEqual([750, 250]);
    });

    it("gives a static item its pixels and the rest to the fractions", () => {
      expect(sizes(1000, [{ size: 200 }, {}, {}])).toEqual([200, 400, 400]);
    });

    it("reads a pixel string as pixels rather than as a fraction", () => {
      expect(sizes(1000, [{ size: "200px" }, {}, {}])).toEqual([200, 400, 400]);
    });

    it("resolves a percentage before dividing what is left", () => {
      expect(sizes(1000, [{ size: "20%" }, {}])).toEqual([200, 800]);
    });

    it("holds an item at its minimum and redistributes the rest", () => {
      expect(sizes(1000, [{ minSize: 400, size: "1fr" }, { size: "3fr" }])).toEqual([400, 600]);
    });

    it("holds an item at its maximum and gives the surplus to the others", () => {
      expect(sizes(1000, [{ maxSize: 200, size: "1fr" }, { size: "1fr" }])).toEqual([200, 800]);
    });

    it("keeps every item at the default minimum it is given", () => {
      expect(sizes(100, [{}, {}])).toEqual([75, 75]);
    });

    it("sums to the container size even when the split does not divide evenly", () => {
      const result = sizes(1000, [{}, {}, {}]);

      expect(result.reduce((total, size) => total + size, 0)).toBe(1000);
    });

    it("hands the sub-pixel remainder to the last item", () => {
      const result = sizes(1000.5, [{}, {}]);

      expect(result.at(-1)! % 1).toBeCloseTo(0.5);
    });

    it("takes a controlled size over the default one", () => {
      expect(sizes(1000, [{ defaultSize: "1fr", size: 300 }, {}])).toEqual([300, 700]);
    });
  });
});
