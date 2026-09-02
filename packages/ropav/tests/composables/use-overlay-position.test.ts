import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, shallowRef } from "vue";

import { useOverlayPosition } from "@/composables/use-overlay-position";

import { withScope } from "../harness/scope";

/*
 * Geometry is not asserted here. Every rect in jsdom is zero, so a test that checked coordinates
 * would be checking `calculatePosition` against a layout that does not exist — that belongs in a
 * browser test. What this covers is everything around the measurement: what is written before it,
 * when the position is kept and when it is dropped, and which scroll closes the overlay.
 */

/** Give an element a rect, since jsdom measures everything as zero. */
const sized = (element: HTMLElement, width: number, height: number) => {
  element.getBoundingClientRect = () =>
    ({
      bottom: height,
      height,
      left: 0,
      right: width,
      toJSON: () => ({}),
      top: 0,
      width,
      x: 0,
      y: 0,
    }) as DOMRect;

  return element;
};

const mount = () => {
  const scroller = document.createElement("div");
  const target = sized(document.createElement("button"), 120, 32);
  const overlay = sized(document.createElement("div"), 200, 150);

  scroller.appendChild(target);
  document.body.append(scroller, overlay);

  return { overlay, scroller, target };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useOverlayPosition", () => {
  describe("before it has measured", () => {
    it("reports no placement and no arrow style", () => {
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: null, targetRef: null }),
      );

      expect(result.placement.value).toBe(null);

      // Empty rather than a corner, so the arrow stays where its own stylesheet put it instead of
      // jumping in from the origin.
      expect(result.arrowStyle.value).toEqual({});

      dispose();
    });

    it("does nothing when there is no overlay or no target", async () => {
      const { target } = mount();
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: null, targetRef: target }),
      );

      await nextTick();

      expect(() => result.updatePosition()).not.toThrow();
      expect(result.placement.value).toBe(null);

      dispose();
    });
  });

  describe("measuring", () => {
    /*
     * The stylesheet turns this into the overlay's `min-width` for a picker, so it has to be on the
     * element before the overlay is measured — otherwise the overlay is measured at its content
     * width, placed there, and nothing repositions it once the rule widens it a flush later.
     */
    it("writes the trigger width onto the overlay", async () => {
      const { overlay, target } = mount();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: overlay, targetRef: target }),
      );

      await nextTick();

      expect(overlay.style.getPropertyValue("--trigger-width")).toBe("120px");

      dispose();
    });

    it("reports the side it ended up on once measured", async () => {
      const { overlay, target } = mount();
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: overlay, placement: "bottom", targetRef: target }),
      );

      await nextTick();

      expect(result.placement.value).not.toBe(null);

      dispose();
    });

    it("writes the position to the inline style as well as returning it", async () => {
      const { overlay, target } = mount();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: overlay, targetRef: target }),
      );

      await nextTick();

      // A render pass would land a frame late, and for that frame the overlay would be visible in
      // the wrong place.
      expect(overlay.style.top === "" && overlay.style.bottom === "").toBe(false);

      dispose();
    });
  });

  describe("the position's lifetime", () => {
    /*
     * A closed overlay that is still rendered is animating out, and it animates out from where it
     * was. Clearing the position would drop it at the viewport origin for the animation's length.
     */
    it("keeps the position while a closed overlay is still rendered", async () => {
      const { overlay, target } = mount();
      const isOpen = shallowRef(true);
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ isOpen, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();

      const measured = result.placement.value;

      expect(measured).not.toBe(null);

      isOpen.value = false;
      await nextTick();

      expect(result.placement.value).toBe(measured);

      dispose();
    });

    /* So the next open measures afresh rather than animating in from wherever the last one sat. */
    it("drops the position when the overlay leaves the DOM", async () => {
      const { overlay, target } = mount();
      const overlayRef = shallowRef<HTMLElement | null>(overlay);
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef, targetRef: target }),
      );

      await nextTick();

      expect(result.placement.value).not.toBe(null);

      overlayRef.value = null;
      await nextTick();

      expect(result.placement.value).toBe(null);

      dispose();
    });
  });

  describe("closing on scroll", () => {
    /*
     * Scrolling a scrollable ancestor of the trigger moves the trigger out from under the overlay,
     * and there is no sane position left to take.
     */
    it("closes when an ancestor of the trigger scrolls", async () => {
      const { overlay, scroller, target } = mount();
      const onClose = vi.fn();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ onClose, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      scroller.dispatchEvent(new Event("scroll", { bubbles: false }));

      expect(onClose).toHaveBeenCalledOnce();

      dispose();
    });

    /* Page scroll is either blocked while the overlay is open, or the overlay scrolls with it. */
    it("ignores the document and the body scrolling", async () => {
      const { overlay, target } = mount();
      const onClose = vi.fn();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ onClose, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      document.documentElement.dispatchEvent(new Event("scroll"));
      document.body.dispatchEvent(new Event("scroll"));

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("ignores a scroll somewhere that does not contain the trigger", async () => {
      const { overlay, target } = mount();
      const elsewhere = document.createElement("div");

      document.body.appendChild(elsewhere);

      const onClose = vi.fn();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ onClose, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      elsewhere.dispatchEvent(new Event("scroll"));

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });

    it("listens only while the overlay is open", async () => {
      const { overlay, scroller, target } = mount();
      const isOpen = shallowRef(false);
      const onClose = vi.fn();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ isOpen, onClose, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      scroller.dispatchEvent(new Event("scroll"));

      expect(onClose).not.toHaveBeenCalled();

      isOpen.value = true;
      await nextTick();
      scroller.dispatchEvent(new Event("scroll"));

      expect(onClose).toHaveBeenCalledOnce();

      dispose();
    });

    it("stops listening once the component is gone", async () => {
      const { overlay, scroller, target } = mount();
      const onClose = vi.fn();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ onClose, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      dispose();
      scroller.dispatchEvent(new Event("scroll"));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("repositioning", () => {
    it("measures again when the window resizes", async () => {
      const { overlay, target } = mount();
      const [, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      sized(target, 300, 32);
      window.dispatchEvent(new Event("resize"));

      expect(overlay.style.getPropertyValue("--trigger-width")).toBe("300px");

      dispose();
    });

    it("measures again when an option changes", async () => {
      const { overlay, target } = mount();
      const offset = shallowRef(0);
      const [, dispose] = withScope(() =>
        useOverlayPosition({ offset, overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      sized(target, 250, 32);
      offset.value = 8;
      await nextTick();

      expect(overlay.style.getPropertyValue("--trigger-width")).toBe("250px");

      dispose();
    });

    it("measures again when a caller asks it to", async () => {
      const { overlay, target } = mount();
      const [result, dispose] = withScope(() =>
        useOverlayPosition({ overlayRef: overlay, targetRef: target }),
      );

      await nextTick();
      sized(target, 175, 32);
      result.updatePosition();

      expect(overlay.style.getPropertyValue("--trigger-width")).toBe("175px");

      dispose();
    });
  });
});
