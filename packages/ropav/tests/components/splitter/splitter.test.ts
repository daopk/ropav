import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";
import NestedFixture from "./nested-fixtures.vue";

/**
 * jsdom reports every box as zero and the whole layout is derived from the container, so
 * `clientWidth`/`clientHeight` are stubbed for the length of this suite. Without them every panel
 * would come out unsized and nothing about the division could be asserted.
 *
 * `offsetWidth` is deliberately left at zero, so the handles measure nothing and the panels divide
 * the whole container — which keeps the arithmetic in these cases exact.
 */
const CONTAINER = 1000;

const restore: (() => void)[] = [];

beforeEach(() => {
  for (const property of ["clientWidth", "clientHeight"] as const) {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property);

    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get: () => CONTAINER,
    });

    restore.push(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, property, original);
    });
  }
});

afterEach(() => restore.splice(0).forEach((undo) => undo()));

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (container: HTMLElement, name: string) => [
  ...container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
];

const basisOf = (panel: HTMLElement) => parseFloat(panel.style.flexBasis);

const key = (element: HTMLElement, keyName: string, init: KeyboardEventInit = {}) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: keyName, ...init }),
  );

  return nextTick();
};

const render = async (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  await nextTick();

  return result;
};

describe("Splitter", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", async () => {
      const { container, unmount } = await render();

      expect(slot(container, "splitter")).toBeTruthy();
      expect(slots(container, "splitter-panel")).toHaveLength(2);
      expect(slots(container, "splitter-handle")).toHaveLength(1);
      expect(slot(container, "splitter-handle-grip")).toBeTruthy();
      unmount();
    });

    it("renders the BEM classes of each part", async () => {
      const { container, unmount } = await render();

      expect(slot(container, "splitter").className).toContain("splitter");
      expect(slot(container, "splitter").className).toContain("splitter--horizontal");
      expect(slot(container, "splitter-panel").className).toContain("splitter__panel");
      expect(slot(container, "splitter-handle").className).toContain("splitter__handle");
      expect(slot(container, "splitter-handle").className).toContain(
        "splitter__handle--horizontal",
      );
      expect(slot(container, "splitter-handle-grip").className).toContain("splitter__handle-grip");
      unmount();
    });

    it("merges a caller class into the root", async () => {
      const { container, unmount } = await render({ class: "custom" });

      expect(slot(container, "splitter").className).toContain("custom");
      unmount();
    });

    it("puts one handle between every pair of panels, and none at the ends", async () => {
      const { container, unmount } = await render({
        panels: [{ id: "a" }, { id: "b" }, { id: "c" }],
      });

      const children = [...slot(container, "splitter").children].map((child) =>
        child.getAttribute("data-slot"),
      );

      expect(children).toEqual([
        "splitter-panel",
        "splitter-handle",
        "splitter-panel",
        "splitter-handle",
        "splitter-panel",
      ]);
      unmount();
    });
  });

  describe("orientation", () => {
    it("reports the orientation on the root and on every handle", async () => {
      const { container, unmount } = await render({ orientation: "vertical" });

      expect(slot(container, "splitter").dataset["orientation"]).toBe("vertical");
      expect(slot(container, "splitter").className).toContain("splitter--vertical");
      expect(slot(container, "splitter-handle").className).toContain("splitter__handle--vertical");
      unmount();
    });

    /*
     * The case a `[data-orientation]` descendant selector would have broken silently: the outer
     * group's rule would reach the inner group's handle and lay it out on the wrong axis. The
     * modifier class is what keeps each handle answering to its own group.
     */
    it("gives a nested group of the opposite axis its own modifier", async () => {
      const { container, unmount } = renderVapor(NestedFixture, {});

      await nextTick();

      const handles = slots(container, "splitter-handle");
      const [outer, inner] = handles;

      expect(handles).toHaveLength(2);
      expect(outer!.className).toContain("splitter__handle--horizontal");
      expect(outer!.className).not.toContain("splitter__handle--vertical");
      expect(inner!.className).toContain("splitter__handle--vertical");
      expect(inner!.className).not.toContain("splitter__handle--horizontal");
      unmount();
    });
  });

  describe("accessibility", () => {
    it("declares role=separator on each handle", async () => {
      const { container, unmount } = await render();

      expect(slot(container, "splitter-handle").getAttribute("role")).toBe("separator");
      unmount();
    });

    /*
     * `aria-orientation` describes the separator's own line, not the group's axis, so it is the
     * inverse of `data-orientation` on purpose. Getting this backwards is the easiest mistake here.
     */
    it("orients the separator across the group's axis, not along it", async () => {
      const horizontal = await render();

      expect(slot(horizontal.container, "splitter-handle").getAttribute("aria-orientation")).toBe(
        "vertical",
      );
      horizontal.unmount();

      const vertical = await render({ orientation: "vertical" });

      expect(slot(vertical.container, "splitter-handle").getAttribute("aria-orientation")).toBe(
        "horizontal",
      );
      vertical.unmount();
    });

    it("reports where the edge sits and how far it can travel", async () => {
      const { container, unmount } = await render({
        panels: [{ id: "a", maxSize: 700, minSize: 200 }, { id: "b" }],
      });
      const handle = slot(container, "splitter-handle");

      expect(handle.getAttribute("aria-valuenow")).toBe("50");
      expect(handle.getAttribute("aria-valuemin")).toBe("20");
      expect(handle.getAttribute("aria-valuemax")).toBe("70");
      expect(handle.getAttribute("aria-valuetext")).toBe("50%");
      unmount();
    });

    it("points the handle at the panel it grows", async () => {
      const { container, unmount } = await render();
      const [before] = slots(container, "splitter-panel");

      expect(slot(container, "splitter-handle").getAttribute("aria-controls")).toBe(before!.id);
      unmount();
    });

    it("names the handle", async () => {
      const { container, unmount } = await render();

      expect(slot(container, "splitter-handle").getAttribute("aria-label")).toBe("Resize panel");
      unmount();
    });

    it("is reachable by keyboard", async () => {
      const { container, unmount } = await render();

      expect(slot(container, "splitter-handle").getAttribute("tabindex")).toBe("0");
      unmount();
    });
  });

  describe("sizing", () => {
    it("gives every panel an explicit flex basis", async () => {
      const { container, unmount } = await render();

      for (const panel of slots(container, "splitter-panel")) {
        expect(panel.style.flexBasis).not.toBe("");
      }
      unmount();
    });

    /* The whole shorthand, so the stylesheet's `flex-1` cannot grow the panel back. */
    it("pins the panel so it cannot grow past the size it is given", async () => {
      const { container, unmount } = await render();
      const panel = slot(container, "splitter-panel");

      expect(panel.style.flexGrow).toBe("0");
      expect(panel.style.flexShrink).toBe("0");
      unmount();
    });

    it("divides evenly when no panel asks for a size", async () => {
      const { container, unmount } = await render();

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });

    it("honours a default size and gives the rest to the others", async () => {
      const { container, unmount } = await render({
        panels: [{ defaultSize: "240px", id: "a" }, { id: "b" }],
      });

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([240, 760]);
      unmount();
    });

    it("follows a controlled sizes prop", async () => {
      const { container, unmount } = await render({ sizes: ["25%", "1fr"] });

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([250, 750]);
      unmount();
    });

    /*
     * A flex item's automatic minimum is its content, so without `min-width: 0` from the
     * stylesheet a panel holding an unbreakable word could never be dragged past it.
     */
    it("still sizes a panel holding unbreakable content", async () => {
      const { container, unmount } = await render({
        panels: [{ id: "a", minSize: 50 }, { id: "b" }],
        withWideContent: true,
      });

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });
  });

  describe("keyboard", () => {
    it("steps the edge with the arrows on the group's axis", async () => {
      const { container, unmount } = await render();
      const handle = slot(container, "splitter-handle");

      await key(handle, "ArrowRight");

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([510, 490]);
      unmount();
    });

    it("steps back the other way", async () => {
      const { container, unmount } = await render();

      await key(slot(container, "splitter-handle"), "ArrowLeft");

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([490, 510]);
      unmount();
    });

    it("takes a bigger step with shift held", async () => {
      const { container, unmount } = await render();

      await key(slot(container, "splitter-handle"), "ArrowRight", { shiftKey: true });

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([550, 450]);
      unmount();
    });

    /* Left to the browser, so a panel that scrolls horizontally still can. */
    it("ignores the arrows on the cross axis", async () => {
      const { container, unmount } = await render();

      await key(slot(container, "splitter-handle"), "ArrowUp");

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });

    it("jumps to the minimum on Home and the maximum on End", async () => {
      const { container, unmount } = await render({
        panels: [{ id: "a", maxSize: 700, minSize: 200 }, { id: "b" }],
      });
      const handle = slot(container, "splitter-handle");

      await key(handle, "Home");
      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([200, 800]);

      await key(handle, "End");
      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([700, 300]);
      unmount();
    });

    it("stops at a neighbour's minimum", async () => {
      const { container, unmount } = await render({
        panels: [{ id: "a" }, { id: "b", minSize: 495 }],
      });

      await key(slot(container, "splitter-handle"), "ArrowRight");
      await key(slot(container, "splitter-handle"), "ArrowRight");

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([505, 495]);
      unmount();
    });

    it("reports the new sizes to the caller", async () => {
      const onResize = vi.fn();
      const { container, unmount } = await render({ onResize });

      await key(slot(container, "splitter-handle"), "ArrowRight");

      expect(onResize).toHaveBeenCalledWith(["1.02fr", "0.98fr"]);
      unmount();
    });
  });

  describe("disabled", () => {
    it("marks the root and every handle", async () => {
      const { container, unmount } = await render({ isDisabled: true });

      expect(slot(container, "splitter").dataset["disabled"]).toBe("true");
      expect(slot(container, "splitter-handle").dataset["disabled"]).toBe("true");
      unmount();
    });

    it("takes every handle out of the tab order", async () => {
      const { container, unmount } = await render({ isDisabled: true });

      expect(slot(container, "splitter-handle").getAttribute("tabindex")).toBe("-1");
      unmount();
    });

    it("ignores the keyboard", async () => {
      const { container, unmount } = await render({ isDisabled: true });

      await key(slot(container, "splitter-handle"), "ArrowRight");

      expect(slots(container, "splitter-panel").map(basisOf)).toEqual([500, 500]);
      unmount();
    });
  });
});
