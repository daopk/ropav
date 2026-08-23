import {describe, expect, it} from "vitest";

import {Point, Rect, Size} from "@/utils/virtualizer-geometry";

describe("Point", () => {
  it("exposes equality and the origin", () => {
    expect(new Point().isOrigin()).toBe(true);
    expect(new Point(1, 0).isOrigin()).toBe(false);
    expect(new Point(2, 3).equals(new Point(2, 3))).toBe(true);
    expect(new Point(2, 3).equals(new Point(3, 2))).toBe(false);
  });

  it("copies without sharing identity", () => {
    const point = new Point(4, 5);
    const copy = point.copy();

    copy.x = 9;

    expect(point.x).toBe(4);
    expect(copy.y).toBe(5);
  });
});

describe("Size", () => {
  it("clamps negative dimensions to zero", () => {
    const size = new Size(-10, -1);

    expect(size.width).toBe(0);
    expect(size.height).toBe(0);
  });

  it("exposes area and equality", () => {
    expect(new Size(3, 4).area).toBe(12);
    expect(new Size(3, 4).equals(new Size(3, 4))).toBe(true);
    expect(new Size(3, 4).equals(new Size(4, 3))).toBe(false);
  });
});

describe("Rect", () => {
  it("derives its edges, area and corners", () => {
    const rect = new Rect(10, 20, 30, 40);

    expect([rect.maxX, rect.maxY, rect.area]).toEqual([40, 60, 1200]);
    expect(rect.topLeft.equals(new Point(10, 20))).toBe(true);
    expect(rect.topRight.equals(new Point(40, 20))).toBe(true);
    expect(rect.bottomLeft.equals(new Point(10, 60))).toBe(true);
    expect(rect.bottomRight.equals(new Point(40, 60))).toBe(true);
  });

  describe("intersects", () => {
    it("reports overlapping and edge-sharing rectangles", () => {
      const rect = new Rect(0, 0, 100, 100);

      expect(rect.intersects(new Rect(50, 50, 100, 100))).toBe(true);
      // Sharing an edge counts, matching React Aria's inclusive comparison.
      expect(rect.intersects(new Rect(100, 0, 10, 10))).toBe(true);
      expect(rect.intersects(new Rect(101, 0, 10, 10))).toBe(false);
    });

    it("reports no intersection for an empty rectangle", () => {
      // The guard React Aria drops under NODE_ENV=test. A collection whose container has not
      // been measured has a zero-area visible rect, and must not report every item as visible.
      const unmeasured = new Rect(0, 0, 0, 0);

      expect(unmeasured.intersects(new Rect(0, 0, 300, 50_000))).toBe(false);
      expect(new Rect(0, 0, 300, 50_000).intersects(unmeasured)).toBe(false);
      expect(new Rect(0, 0, 300, 0).intersects(new Rect(0, 0, 300, 400))).toBe(false);
    });
  });

  it("reports containment of rectangles and points", () => {
    const rect = new Rect(0, 0, 100, 100);

    expect(rect.containsRect(new Rect(10, 10, 10, 10))).toBe(true);
    expect(rect.containsRect(new Rect(10, 10, 200, 10))).toBe(false);
    expect(rect.containsPoint(new Point(100, 100))).toBe(true);
    expect(rect.containsPoint(new Point(101, 0))).toBe(false);
  });

  it("finds the first corner inside another rectangle", () => {
    const rect = new Rect(0, 0, 100, 100);

    expect(rect.getCornerInRect(new Rect(-10, -10, 20, 20))).toBe("topLeft");
    expect(rect.getCornerInRect(new Rect(90, 90, 20, 20))).toBe("bottomRight");
    expect(rect.getCornerInRect(new Rect(500, 500, 20, 20))).toBe(null);
  });

  it("unions and intersects into new rectangles", () => {
    const first = new Rect(0, 0, 100, 100);
    const second = new Rect(50, 50, 100, 100);

    expect(first.union(second)).toEqual(new Rect(0, 0, 150, 150));
    expect(first.intersection(second)).toEqual(new Rect(50, 50, 50, 50));
    // No intersection collapses to all zero rather than to negative dimensions.
    expect(first.intersection(new Rect(500, 500, 10, 10))).toEqual(new Rect(0, 0, 0, 0));
  });

  it("compares position and size separately", () => {
    const rect = new Rect(1, 2, 3, 4);

    expect(rect.pointEquals(new Rect(1, 2, 9, 9))).toBe(true);
    expect(rect.sizeEquals(new Rect(9, 9, 3, 4))).toBe(true);
    expect(rect.equals(new Rect(1, 2, 3, 4))).toBe(true);
    expect(rect.equals(new Rect(1, 2, 3, 5))).toBe(false);
  });
});
