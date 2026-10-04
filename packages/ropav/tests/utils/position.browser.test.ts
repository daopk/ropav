import { afterEach, describe, expect, it } from "vitest";

import { calculatePosition } from "@/utils/position";

afterEach(() => {
  document.body.replaceChildren();
  document.body.removeAttribute("style");
  document.documentElement.scrollTop = 0;
});

/** Places an overlay above a trigger, both inside the body, and returns where each landed. */
const placeAbove = (triggerTop = 300) => {
  const trigger = document.createElement("button");
  const overlay = document.createElement("div");

  trigger.textContent = "Trigger";
  trigger.style.cssText = `position: absolute; left: 200px; top: ${triggerTop}px; width: 80px; height: 30px`;
  overlay.style.cssText = "position: absolute; width: 100px; height: 40px";
  document.body.append(trigger, overlay);

  const { placement, position } = calculatePosition({
    boundaryElement: document.body,
    crossOffset: 0,
    offset: 8,
    overlayNode: overlay,
    padding: 12,
    placement: "top",
    shouldFlip: true,
    targetNode: trigger,
  });

  for (const [key, value] of Object.entries(position)) {
    overlay.style[key as "top" | "left" | "bottom" | "right"] = `${value}px`;
  }

  return {
    overlay: overlay.getBoundingClientRect(),
    placement,
    trigger: trigger.getBoundingClientRect(),
  };
};

describe("calculatePosition in a browser", () => {
  // Layout containment makes the body the overlay's containing block, so the overlay is placed
  // from the body's padding box rather than from the viewport, which the body's margin sets apart.
  it.each(["layout", "paint", "content", "strict"])(
    "places an overlay against a body with `contain: %s`",
    (contain) => {
      document.body.style.cssText = `contain: ${contain}; margin: 30px; height: 600px`;

      const { overlay, placement, trigger } = placeAbove();

      expect(placement).toBe("top");
      expect(overlay.left + overlay.width / 2).toBeCloseTo(trigger.left + trigger.width / 2, 0);
      expect(trigger.top - overlay.bottom).toBeCloseTo(8, 0);
    },
  );

  // A body taller than the viewport: an overlay placed from its bottom edge is measured from the
  // bottom of the body, not of the viewport, so the body must be sized as itself.
  describe.each([
    ["position: relative"],
    ["contain: paint"],
    ["contain: layout"],
    ["transform: translateZ(0)"],
  ])("against a body taller than the viewport, with `%s`", (style) => {
    it("places an overlay above its trigger", () => {
      document.body.style.cssText = `${style}; margin: 30px; min-height: 2000px`;

      const { overlay, placement, trigger } = placeAbove();

      expect(placement).toBe("top");
      expect(overlay.left + overlay.width / 2).toBeCloseTo(trigger.left + trigger.width / 2, 0);
      expect(trigger.top - overlay.bottom).toBeCloseTo(8, 0);
    });

    it("places an overlay above its trigger with the document scrolled", () => {
      document.body.style.cssText = `${style}; margin: 30px; min-height: 2000px`;
      document.documentElement.scrollTop = 400;

      const { overlay, placement, trigger } = placeAbove(600);

      expect(document.documentElement.scrollTop).toBe(400);
      expect(placement).toBe("top");
      expect(overlay.left + overlay.width / 2).toBeCloseTo(trigger.left + trigger.width / 2, 0);
      expect(trigger.top - overlay.bottom).toBeCloseTo(8, 0);
    });

    it("flips an overlay below a trigger near the top of the viewport", () => {
      document.body.style.cssText = `${style}; margin: 30px; min-height: 2000px`;
      document.documentElement.scrollTop = 400;

      const { overlay, placement, trigger } = placeAbove(400);

      expect(placement).toBe("bottom");
      expect(overlay.top - trigger.bottom).toBeCloseTo(8, 0);
    });
  });
});
