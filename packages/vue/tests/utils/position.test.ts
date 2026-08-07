import type {Placement} from "@/utils/position";

import {describe, expect, it} from "vitest";

import {calculatePositionInternal, translateRTL} from "@/utils/position";

/**
 * jsdom has no layout, so the measurements are supplied by hand and the arithmetic is what is
 * under test. The real measuring is covered by the browser suites, which compare geometry
 * against the React build.
 */
const VIEWPORT = {
  height: 800,
  left: 0,
  scroll: {left: 0, top: 0},
  top: 0,
  totalHeight: 800,
  totalWidth: 1000,
  width: 1000,
};

const NO_MARGINS = {bottom: 0, left: 0, right: 0, top: 0};
const NO_CONTAINER_OFFSET = {height: 0, left: 0, top: 0, width: 0};

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const position = (
  placement: Placement,
  trigger: Rect,
  overlay: Rect,
  options: {
    flip?: boolean;
    offset?: number;
    crossOffset?: number;
    padding?: number;
    maxHeight?: number;
  } = {},
) =>
  calculatePositionInternal(
    placement,
    trigger,
    // Copied, because the overlay size is capped in place by the height calculation.
    {...overlay},
    NO_MARGINS,
    options.padding ?? 12,
    options.flip ?? true,
    VIEWPORT,
    VIEWPORT,
    NO_CONTAINER_OFFSET,
    options.offset ?? 8,
    options.crossOffset ?? 0,
    false,
    options.maxHeight,
    0,
    0,
    false,
    null,
  );

const TRIGGER = {height: 40, left: 200, top: 100, width: 80};
/** Far enough down the viewport that there is room for the overlay on either side of it. */
const MID_TRIGGER = {height: 40, left: 200, top: 400, width: 80};
const OVERLAY = {height: 160, left: 0, top: 0, width: 220};

describe("calculatePosition", () => {
  describe("placement", () => {
    it("puts the overlay below the trigger, offset from it", () => {
      const result = position("bottom left", TRIGGER, OVERLAY);

      expect(result.placement).toBe("bottom");
      expect(result.position.top).toBe(148);
      expect(result.position.left).toBe(200);
    });

    it("aligns the overlay's start edge to the trigger's start edge", () => {
      const result = position("bottom left", TRIGGER, OVERLAY);

      expect(result.position.left).toBe(TRIGGER.left);
    });

    it("aligns the overlay's end edge to the trigger's end edge", () => {
      const result = position("bottom right", TRIGGER, OVERLAY);

      expect(result.position.left).toBe(TRIGGER.left + TRIGGER.width - OVERLAY.width);
    });

    it("centres the overlay on the trigger when no alignment is given", () => {
      const result = position("bottom", TRIGGER, OVERLAY);

      expect(result.position.left).toBe(TRIGGER.left + (TRIGGER.width - OVERLAY.width) / 2);
    });

    it("positions from the far edge when placed above", () => {
      const result = position("top left", MID_TRIGGER, OVERLAY);

      expect(result.placement).toBe("top");
      // Positioned by `bottom` rather than `top`, so the overlay grows upwards from the
      // trigger instead of being pushed down as it gets taller.
      expect(result.position.bottom).toBe(VIEWPORT.totalHeight - MID_TRIGGER.top + 8);
      expect(result.position.top).toBeUndefined();
    });

    it("puts the overlay beside the trigger for a horizontal placement", () => {
      const result = position("right top", TRIGGER, OVERLAY);

      expect(result.placement).toBe("right");
      expect(result.position.left).toBe(TRIGGER.left + TRIGGER.width + 8);
      expect(result.position.top).toBe(TRIGGER.top);
    });

    it("applies a cross-axis offset", () => {
      const result = position("bottom left", TRIGGER, OVERLAY, {crossOffset: 16});

      expect(result.position.left).toBe(TRIGGER.left + 16);
    });
  });

  describe("flipping", () => {
    it("flips below when there is not enough room above", () => {
      const nearTop = {height: 40, left: 200, top: 30, width: 80};
      const result = position("top left", nearTop, OVERLAY);

      expect(result.placement).toBe("bottom");
      expect(result.position.top).toBe(nearTop.top + nearTop.height + 8);
    });

    it("flips above when there is not enough room below", () => {
      const nearBottom = {height: 40, left: 200, top: 700, width: 80};
      const result = position("bottom left", nearBottom, OVERLAY);

      expect(result.placement).toBe("top");
    });

    it("stays put when flipping would not help", () => {
      // Cramped both ways: flipping would only move the problem, and a menu that jumps sides
      // for no gain is worse than one that stays where it was asked to be.
      const tall = {height: 40, left: 200, top: 380, width: 80};
      const result = position("bottom left", tall, {height: 700, left: 0, top: 0, width: 220});

      expect(result.placement).toBe("bottom");
    });

    it("honours a caller that refuses to flip", () => {
      const nearBottom = {height: 40, left: 200, top: 700, width: 80};
      const result = position("bottom left", nearBottom, OVERLAY, {flip: false});

      expect(result.placement).toBe("bottom");
    });
  });

  describe("staying inside the boundary", () => {
    it("shifts an overlay that would overflow the end edge", () => {
      const nearRight = {height: 40, left: 940, top: 100, width: 80};
      const result = position("bottom left", nearRight, OVERLAY);

      // Its end edge lands on the boundary's padded edge rather than off screen.
      expect(result.position.left! + OVERLAY.width).toBe(VIEWPORT.width - 12);
    });

    it("shifts an overlay that would overflow the start edge", () => {
      const nearLeft = {height: 40, left: 0, top: 100, width: 80};
      const result = position("bottom right", nearLeft, OVERLAY);

      expect(result.position.left).toBe(12);
    });

    it("keeps the overlay overlapping its trigger on the cross axis", () => {
      // A wide overlay aligned to a narrow trigger far to the right would otherwise be pushed
      // clear of the trigger, leaving an arrow pointing at nothing.
      const result = position("bottom left", TRIGGER, {height: 160, left: 0, top: 0, width: 900});

      expect(result.position.left).toBeLessThanOrEqual(TRIGGER.left + TRIGGER.width);
    });
  });

  describe("height", () => {
    it("caps the height at the room left below the trigger", () => {
      const result = position("bottom left", TRIGGER, OVERLAY);

      expect(result.maxHeight).toBe(VIEWPORT.height - 148 - 12);
    });

    it("caps the height at the room left above the trigger", () => {
      const result = position("top left", MID_TRIGGER, OVERLAY);

      expect(result.maxHeight).toBe(MID_TRIGGER.top - 8 - 12);
    });

    it("never reports a negative height", () => {
      const offscreen = {height: 40, left: 200, top: -400, width: 80};
      const result = position("top left", offscreen, OVERLAY, {flip: false});

      expect(result.maxHeight).toBeGreaterThanOrEqual(0);
    });

    it("honours a smaller cap from the caller", () => {
      const result = position("bottom left", TRIGGER, OVERLAY, {maxHeight: 100});

      expect(result.maxHeight).toBe(100);
    });

    it("ignores a caller cap larger than the room available", () => {
      const result = position("bottom left", TRIGGER, OVERLAY, {maxHeight: 5000});

      expect(result.maxHeight).toBe(VIEWPORT.height - 148 - 12);
    });
  });

  describe("anchor point", () => {
    it("anchors a start-aligned overlay to its own start corner", () => {
      const result = position("bottom left", TRIGGER, OVERLAY);

      // The stylesheet uses this as the transform origin, so the overlay grows out of the
      // trigger rather than out of its own centre.
      expect(result.triggerAnchorPoint).toEqual({x: 0, y: 0});
    });

    it("anchors a centred overlay to the middle of the trigger", () => {
      const result = position("bottom", TRIGGER, OVERLAY);

      expect(result.triggerAnchorPoint.x).toBe(OVERLAY.width / 2);
      expect(result.triggerAnchorPoint.y).toBe(0);
    });

    it("anchors an overlay placed above to its own bottom edge", () => {
      const result = position("top left", MID_TRIGGER, OVERLAY);

      expect(result.triggerAnchorPoint.y).toBe(OVERLAY.height);
    });

    it("anchors an overlay placed to the right to its own left edge", () => {
      const result = position("right top", TRIGGER, OVERLAY);

      expect(result.triggerAnchorPoint.x).toBe(0);
      expect(result.triggerAnchorPoint.y).toBe(0);
    });
  });
});

describe("translateRTL", () => {
  it("resolves logical alignment left to right", () => {
    expect(translateRTL("bottom start", "ltr")).toBe("bottom left");
    expect(translateRTL("end top", "ltr")).toBe("right top");
  });

  it("resolves logical alignment right to left", () => {
    expect(translateRTL("bottom start", "rtl")).toBe("bottom right");
    expect(translateRTL("end top", "rtl")).toBe("left top");
  });

  it("leaves a physical placement alone", () => {
    expect(translateRTL("bottom left", "rtl")).toBe("bottom left");
  });
});
