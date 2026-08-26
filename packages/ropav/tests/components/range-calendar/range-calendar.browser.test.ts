import { CalendarDate } from "@internationalized/date";
import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/**
 * `aria-required-children`: the year picker's grid is a `listbox` whose children are cells rather
 * than `option`s - a shape react-aria's own build fails in the same place. The contrast exclusion
 * it is spread onto is the palette's, not this component's.
 */
const SHARED_WITH_REACT = {
  rules: {
    ...PALETTE_CONTRAST_DEBT.rules,
    "aria-required-children": { enabled: false },
  },
};

const render = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {
    props: { ariaLabel: "Stay", defaultFocusedValue: jun(15), locale: "en-US", ...props },
  });

type RenderResult = ReturnType<typeof render>;

let mounted: RenderResult | null = null;

const mount = (props: Record<string, unknown> = {}) => {
  mounted = render(props);

  return mounted;
};

const cellsOf = (result: RenderResult) => [
  ...result.container.querySelectorAll<HTMLElement>("[data-slot='range-calendar-cell']"),
];

const cellOf = (result: RenderResult, day: number) =>
  cellsOf(result).find(
    (element) => element.textContent?.trim() === String(day) && !element.dataset["outsideMonth"],
  )!;

const daysWith = (result: RenderResult, attribute: string) =>
  cellsOf(result)
    .filter((cell) => cell.getAttribute(attribute) === "true")
    .map((cell) => cell.textContent?.trim());

afterEach(() => {
  mounted?.unmount();
  mounted = null;
});

/**
 * Almost everything a range calendar adds is about a range the user has started and not finished:
 * the highlight follows the pointer between the two presses, and a press that lands outside — or
 * focus leaving altogether — has to settle it. None of that survives a synthetic pointer, which
 * sends no `pointerenter` and never re-renders mid-dispatch.
 */
describe("RangeCalendar (browser)", () => {
  describe("axe", () => {
    it("finds nothing to complain about", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about mid-range", async () => {
      // Half a range: one end anchored, the highlight following the pointer.
      const result = mount();

      await userEvent.click(cellOf(result, 10));
      await nextTick();
      await userEvent.hover(cellOf(result, 14));
      await nextTick();
      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });
  });

  describe("a real pointer", () => {
    it("builds a range from two presses", async () => {
      const onValueChange = vi.fn();
      const result = mount({ onValueChange });

      await userEvent.click(cellOf(result, 10));
      await nextTick();

      // Half a range is not a value, so nothing has been emitted yet.
      expect(onValueChange).not.toHaveBeenCalled();

      await userEvent.click(cellOf(result, 14));
      await nextTick();

      expect(daysWith(result, "data-selected")).toEqual(["10", "11", "12", "13", "14"]);
      expect(String(onValueChange.mock.calls.at(-1)?.[0]?.start)).toBe("2026-06-10");
    });

    it("follows the pointer while the range is half built", async () => {
      /*
       * The highlight comes from `pointerenter` on each cell, not from the value. A synthetic click
       * never sends one, which is why this cannot be asserted in jsdom.
       */
      const result = mount();

      await userEvent.click(cellOf(result, 10));
      await nextTick();
      await userEvent.hover(cellOf(result, 13));
      await nextTick();

      expect(daysWith(result, "data-selected")).toEqual(["10", "11", "12", "13"]);

      await userEvent.hover(cellOf(result, 11));
      await nextTick();

      expect(daysWith(result, "data-selected")).toEqual(["10", "11"]);
    });

    it("marks the two ends of the range apart from the middle", async () => {
      const result = mount({ value: { end: jun(14), start: jun(10) } });

      expect(daysWith(result, "data-selection-start")).toEqual(["10"]);
      expect(daysWith(result, "data-selection-end")).toEqual(["14"]);
    });

    it("settles a half-built range when a press lands outside the calendar", async () => {
      /*
       * The one behaviour that exists only here: a range the user walked away from has to be
       * finished, and the decision is taken on a `pointerup` anywhere outside.
       */
      const result = mount({ value: { end: jun(14), start: jun(10) } });

      await userEvent.click(cellOf(result, 20));
      await nextTick();

      expect(daysWith(result, "data-selected")).toEqual(["20"]);

      await userEvent.click(document.documentElement);
      await nextTick();
      await nextTick();

      // Reset by default: an unfinished range goes back to the one that was there before.
      expect(daysWith(result, "data-selected")).toEqual(["10", "11", "12", "13", "14"]);
    });
  });

  describe("a real keyboard", () => {
    it("builds a range with the arrow keys and Enter", async () => {
      /*
       * Asserted against wherever focus ended up rather than against a counted day: what matters is
       * that the highlight runs from the anchor to the focused cell, not how many keys it took.
       */
      const result = mount({ defaultFocusedValue: jun(10) });

      cellOf(result, 10).focus();
      await userEvent.keyboard("{Enter}");
      await nextTick();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      await nextTick();

      const focused = document.activeElement?.textContent?.trim();
      const highlighted = daysWith(result, "data-selected");

      expect(highlighted[0]).toBe("10");
      expect(highlighted.at(-1)).toBe(focused);

      await userEvent.keyboard("{Enter}");
      await nextTick();

      expect(daysWith(result, "data-selection-start")).toEqual(["10"]);
      expect(daysWith(result, "data-selection-end")).toEqual([focused]);
    });

    it("abandons a half-built range on Escape", async () => {
      const result = mount({
        defaultFocusedValue: jun(10),
        value: { end: jun(20), start: jun(18) },
      });

      cellOf(result, 10).focus();
      await userEvent.keyboard("{Enter}");
      await nextTick();
      await userEvent.keyboard("{ArrowRight}");
      await nextTick();

      // Whatever it grew to, it is no longer the range the caller handed in.
      expect(daysWith(result, "data-selected")[0]).toBe("10");

      await userEvent.keyboard("{Escape}");
      await nextTick();

      expect(daysWith(result, "data-selected")).toEqual(["18", "19", "20"]);
    });

    it("draws a visible focus ring on the focused cell", async () => {
      /*
       * On the wrapper inside the cell, not on the cell: the extra `range-calendar__cell-button`
       * span is exactly what the 361-line range stylesheet paints, and reading the cell itself is
       * how a missing ring would pass unnoticed. `status-focused` draws with a box shadow and sets
       * `outline-style: none`, so the outline is the wrong thing to read either way.
       */
      const result = mount({ defaultFocusedValue: jun(10) });
      const cell = cellOf(result, 10);

      cell.focus();
      await nextTick();

      const painted = cell.querySelector<HTMLElement>("[data-slot='range-calendar-cell-button']")!;

      await settled(painted);

      expect(getComputedStyle(painted).boxShadow).not.toBe("none");
    });

    it("keeps the grid to a single tab stop", async () => {
      const result = mount({ defaultFocusedValue: jun(10) });
      const tabbable = cellsOf(result).filter((cell) => cell.getAttribute("tabindex") === "0");

      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]?.textContent?.trim()).toBe("10");
    });
  });
});
