import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

/** Six swatches, which the fixture's own wrapping turns into rows once there is a width. */
const SIX = ["#F43F5E", "#D946EF", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981"];

const renderPicker = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(Fixture, { props: { colors: SIX, ...props } });

  await nextTick();

  return rendered;
};

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const optionsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[role='option']"),
];

const optionAt = (container: HTMLElement, index: number) => optionsIn(container)[index]!;

/** Which option is the roving tab stop, which is where the collection thinks focus is. */
const focusedIndex = (container: HTMLElement) =>
  optionsIn(container).findIndex((option) => option.getAttribute("tabindex") === "0");

/**
 * Forces the palette into rows of three by capping its width.
 *
 * Grid navigation reads rects, so the rows have to be real. `.color-swatch-picker` is a wrapping
 * flex row, so a width just under four swatches plus their gaps is enough.
 */
const inRows = (container: HTMLElement, width: string) => {
  slot(container, "color-swatch-picker").style.width = width;

  return nextTick();
};

/**
 * The parts of ColorSwatchPicker only a real browser can show. Every one of these needs layout:
 * the block axis of a grid is found by comparing rects, and in jsdom every rect is zeroes, so
 * every swatch reads as sharing one row and ArrowDown can only ever answer "nowhere". A jsdom test
 * for two-dimensional navigation would pass for the wrong reason.
 */
describe("ColorSwatchPicker (browser)", () => {
  describe("two-dimensional navigation", () => {
    it("steps down into the next visible row rather than to the next swatch", async () => {
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      const root = slot(container, "color-swatch-picker");

      // Tab lands on the first swatch itself rather than on the picker, so no arrow press is
      // needed to enter — unlike a synthetic keydown, which has no focus event behind it.
      await userEvent.tab();

      expect(focusedIndex(container)).toBe(0);

      await userEvent.keyboard("{ArrowDown}");

      // Three per row, so the swatch below the first is the fourth — not the second.
      expect(focusedIndex(container)).toBe(3);
      expect(root).toHaveAttribute("tabindex", "-1");

      unmount();
    });

    it("steps back up the same column", async () => {
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      await userEvent.click(optionAt(container, 4));
      await userEvent.keyboard("{ArrowUp}");

      expect(focusedIndex(container)).toBe(1);

      unmount();
    });

    it("stays put in the last row", async () => {
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      await userEvent.click(optionAt(container, 4));
      await userEvent.keyboard("{ArrowDown}");

      expect(focusedIndex(container)).toBe(4);

      unmount();
    });

    it("crosses a row boundary with the inline arrows", async () => {
      // Left and right are the flat order in a grid, so the swatch right of the last in a row is
      // the first in the next.
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      await userEvent.click(optionAt(container, 2));
      await userEvent.keyboard("{ArrowRight}");

      expect(focusedIndex(container)).toBe(3);

      unmount();
    });

    it("reaches every swatch of a wrapped palette by keyboard", async () => {
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      await userEvent.tab();

      const visited = [focusedIndex(container)];

      for (let step = 0; step < 5; step += 1) {
        await userEvent.keyboard("{ArrowRight}");
        visited.push(focusedIndex(container));
      }

      expect(visited).toEqual([0, 1, 2, 3, 4, 5]);

      unmount();
    });

    it("answers ArrowDown by geometry, not by counting", async () => {
      // The same collection in rows of two puts a different swatch below the first, which is what
      // makes this geometry rather than a fixed stride.
      const { container, unmount } = await renderPicker();

      await inRows(container, "96px");

      const rows = new Set(optionsIn(container).map((option) => option.getBoundingClientRect().y));

      expect(rows.size).toBe(3);

      await userEvent.tab();

      expect(focusedIndex(container)).toBe(0);

      await userEvent.keyboard("{ArrowDown}");

      // Two per row here, so the swatch below the first is the third.
      expect(focusedIndex(container)).toBe(2);

      unmount();
    });
  });

  describe("pointer", () => {
    it("selects the swatch that was clicked", async () => {
      const { container, unmount } = await renderPicker();

      await userEvent.click(optionAt(container, 2));

      expect(optionAt(container, 2)).toHaveAttribute("data-selected", "true");
      expect(optionAt(container, 0)).not.toHaveAttribute("data-selected");

      unmount();
    });

    it("moves the roving tab stop to the swatch that was clicked", async () => {
      const { container, unmount } = await renderPicker();

      await userEvent.click(optionAt(container, 3));

      expect(focusedIndex(container)).toBe(3);

      unmount();
    });

    it("leaves a disabled swatch alone", async () => {
      /**
       * A real pointer cannot even reach it: `status-disabled` sets `pointer-events: none`, so a
       * driver click would hang waiting for a hit. Both halves are asserted — the swatch is out of
       * hit testing, and a click forced past that still selects nothing.
       */
      const { container, unmount } = await renderPicker({ disabled: ["#8B5CF6"] });

      await nextTick();

      expect(getComputedStyle(optionAt(container, 2)).pointerEvents).toBe("none");

      optionAt(container, 2).click();
      await nextTick();

      expect(optionAt(container, 2)).not.toHaveAttribute("data-selected");

      unmount();
    });

    it("reports hover on the swatch under the pointer", async () => {
      const { container, unmount } = await renderPicker();

      await userEvent.hover(optionAt(container, 1));

      expect(optionAt(container, 1)).toHaveAttribute("data-hovered", "true");

      await userEvent.hover(optionAt(container, 4));

      expect(optionAt(container, 1)).not.toHaveAttribute("data-hovered");
      expect(optionAt(container, 4)).toHaveAttribute("data-hovered", "true");

      unmount();
    });
  });

  describe("layout", () => {
    it("wraps into rows by default", async () => {
      const { container, unmount } = await renderPicker();

      await inRows(container, "128px");

      const rows = new Set(optionsIn(container).map((option) => option.getBoundingClientRect().y));

      expect(rows.size).toBe(2);

      unmount();
    });

    it("stacks into one column when asked", async () => {
      const { container, unmount } = await renderPicker({ layout: "stack" });

      await nextTick();

      const boxes = optionsIn(container).map((option) => option.getBoundingClientRect());

      expect(new Set(boxes.map((box) => box.x)).size).toBe(1);
      expect(new Set(boxes.map((box) => box.y)).size).toBe(SIX.length);

      unmount();
    });

    it("navigates a stack by geometry too, because it is still a grid underneath", async () => {
      /**
       * The mirrored quirk, made visible: `layout="stack"` styles a column but leaves the
       * collection a grid. One item per row means the item below the first really is the second,
       * so ArrowDown does step — through the grid's rect comparison rather than by counting.
       */
      const { container, unmount } = await renderPicker({ layout: "stack" });

      await nextTick();
      await userEvent.tab();
      await userEvent.keyboard("{ArrowDown}");

      expect(focusedIndex(container)).toBe(1);

      unmount();
    });
  });

  describe("appearance", () => {
    it("shrinks the swatch and colours the border once selected", async () => {
      const { container, unmount } = await renderPicker({ defaultValue: "#D946EF" });

      await nextTick();

      const item = optionAt(container, 1);
      const swatch = item.querySelector<HTMLElement>("[data-slot='color-swatch-picker-swatch']")!;

      // The gap the selected border shows through is a transform on the swatch, not a size.
      expect(getComputedStyle(swatch).transform).not.toBe("none");
      expect(getComputedStyle(item).borderTopColor).toBe("rgb(217, 70, 239)");

      unmount();
    });

    it("leaves an unselected item's border transparent", async () => {
      const { container, unmount } = await renderPicker();

      await nextTick();

      expect(getComputedStyle(optionAt(container, 0)).borderTopColor).toBe("rgba(0, 0, 0, 0)");

      unmount();
    });

    it("paints each swatch its own colour", async () => {
      const { container, unmount } = await renderPicker();

      await nextTick();

      const swatches = [
        ...container.querySelectorAll<HTMLElement>("[data-slot='color-swatch-picker-swatch']"),
      ];

      expect(getComputedStyle(swatches[0]!).backgroundColor).toBe("rgb(244, 63, 94)");
      expect(getComputedStyle(swatches[1]!).backgroundColor).toBe("rgb(217, 70, 239)");

      unmount();
    });

    it("keeps the checkmark out of the way until the swatch is selected", async () => {
      const { container, unmount } = await renderPicker({ defaultValue: "#D946EF" });

      await nextTick();

      const checkmarks = [
        ...container.querySelectorAll<HTMLElement>("[data-slot='color-swatch-picker-checkmark']"),
      ];

      /**
       * Scaled to nothing on the swatches that are not selected, and up on the one that is. Read
       * from `transform` rather than the `scale` property: the stylesheet writes
       * `transform: scale(...) translateZ(0)`, so `scale` computes to `none` and asserting on it
       * would pass for both swatches.
       */
      expect(getComputedStyle(checkmarks[0]!).transform).toBe("matrix(0, 0, 0, 0, 0, 0)");
      expect(getComputedStyle(checkmarks[1]!).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");

      unmount();
    });

    it("shows a focus ring on the swatch the keyboard reached", async () => {
      const { container, unmount } = await renderPicker();

      await userEvent.tab();

      const item = optionAt(container, 0);

      expect(item).toHaveAttribute("data-focus-visible", "true");

      await settled(item);

      expect(getComputedStyle(item).boxShadow).not.toBe("none");

      unmount();
    });

    it("sizes the swatches by the size modifier", async () => {
      const { container, unmount } = await renderPicker({ size: "xl" });

      await nextTick();

      expect(optionAt(container, 0).getBoundingClientRect().width).toBe(40);

      unmount();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container, unmount } = await renderPicker({ defaultValue: "#8B5CF6" });

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });

    it("has no axe violations with a disabled swatch", async () => {
      const { container, unmount } = await renderPicker({ disabled: ["#F43F5E"] });

      await nextTick();
      await expectNoA11yViolations(container);

      unmount();
    });

    it("takes one Tab to leave the whole palette", async () => {
      const { container, unmount } = await renderPicker();

      const after = document.createElement("button");

      document.body.appendChild(after);

      await userEvent.tab();

      expect(focusedIndex(container)).toBe(0);

      await userEvent.tab();

      expect(document.activeElement).toBe(after);

      after.remove();
      unmount();
    });
  });
});
