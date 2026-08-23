import {describe, expect, it} from "vitest";

import {Rect} from "@/utils/virtualizer-geometry";
import {LayoutInfo, layoutInfoToStyle} from "@/utils/virtualizer-layout-info";

const itemAt = (y: number, height = 50) => new LayoutInfo("item", "a", new Rect(0, y, 300, height));

describe("LayoutInfo", () => {
  it("starts with React Aria's defaults", () => {
    const layoutInfo = itemAt(0);

    expect(layoutInfo).toMatchObject({
      allowOverflow: false,
      content: null,
      estimatedSize: false,
      isSticky: false,
      opacity: 1,
      parentKey: null,
      transform: null,
      type: "item",
      zIndex: 0,
    });
  });

  it("copies every field and detaches the rect", () => {
    const layoutInfo = itemAt(100);

    layoutInfo.parentKey = "body";
    layoutInfo.isSticky = true;
    layoutInfo.zIndex = 2;
    layoutInfo.estimatedSize = true;
    layoutInfo.allowOverflow = true;
    layoutInfo.opacity = 0.5;
    layoutInfo.transform = "translateY(1px)";
    layoutInfo.content = {id: "a"};

    const copy = layoutInfo.copy();

    copy.rect.y = 999;

    expect(layoutInfo.rect.y).toBe(100);
    expect(copy).toMatchObject({
      allowOverflow: true,
      content: {id: "a"},
      estimatedSize: true,
      isSticky: true,
      key: "a",
      opacity: 0.5,
      parentKey: "body",
      transform: "translateY(1px)",
      zIndex: 2,
    });
  });
});

describe("layoutInfoToStyle", () => {
  it("positions an absolute item with units and containment", () => {
    expect(layoutInfoToStyle(itemAt(150))).toEqual({
      contain: "size layout style",
      display: undefined,
      height: "50px",
      left: "0px",
      opacity: 1,
      overflow: "hidden",
      position: "absolute",
      top: "150px",
      transform: undefined,
      width: "300px",
      zIndex: 0,
    });
  });

  it("offsets against a parent", () => {
    const parent = new LayoutInfo("rowgroup", "body", new Rect(10, 100, 300, 500));

    expect(layoutInfoToStyle(itemAt(150), parent)).toMatchObject({left: "-10px", top: "50px"});
  });

  it("keeps a sticky element's offset absolute when its parent allows overflow", () => {
    const parent = new LayoutInfo("rowgroup", "body", new Rect(10, 100, 300, 500));

    parent.allowOverflow = true;

    const sticky = itemAt(150);

    sticky.isSticky = true;

    // Positioned against the scroll container, not against the parent, so nothing is subtracted.
    expect(layoutInfoToStyle(sticky, parent)).toMatchObject({
      display: "inline-block",
      left: "0px",
      position: "sticky",
      top: "150px",
    });
  });

  it("drops lengths that are not finite", () => {
    const unbounded = new LayoutInfo("item", "a", new Rect(0, 0, Infinity, Infinity));

    expect(layoutInfoToStyle(unbounded)).toMatchObject({
      height: undefined,
      left: "0px",
      width: undefined,
    });
  });

  it("lets an overflowing element spill", () => {
    const layoutInfo = itemAt(0);

    layoutInfo.allowOverflow = true;

    expect(layoutInfoToStyle(layoutInfo)["overflow"]).toBe("visible");
  });
});
