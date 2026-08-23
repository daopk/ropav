import { CalendarDate } from "@internationalized/date";
import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/**
 * Two rules react-aria's own build fails in exactly the same places, measured on both sides with
 * axe against the open popover.
 *
 * `color-contrast`: a selected calendar cell is near-white on `--accent`, which is about 3.7:1.
 * `landmark-banner-is-top-level`: `RangeCalendar.Header` renders a `<header>`, which is a banner
 * landmark, and inside a popover it is not top level.
 *
 * Both live in `@ropav/styles` and in the component shape it assumes rather than in the behaviour
 * layer, so they are excluded here and recorded as debt instead of being silently absorbed into a
 * green gate.
 */
const SHARED_WITH_REACT = {
  rules: {
    "color-contrast": { enabled: false },
    "landmark-banner-is-top-level": { enabled: false },
  },
};

const render = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, { props: { label: "Trip dates", locale: "en-US", ...props } });

type RenderResult = ReturnType<typeof render>;

let mounted: RenderResult | null = null;

/** Mount and remember it, so a throwing assertion still gets torn down. */
const mount = (props: Record<string, unknown> = {}) => {
  mounted = render(props);

  return mounted;
};

const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const popoverOf = () => document.body.querySelector<HTMLElement>(".date-range-picker__popover");

const triggerOf = (result: RenderResult) =>
  result.container.querySelector<HTMLElement>("[data-slot='date-range-picker-trigger']")!;

/** The two rows of segments, in DOM order: start first, then end. */
const rowsOf = (result: RenderResult) => [
  ...result.container.querySelectorAll<HTMLElement>("[data-slot='date-input-group-input']"),
];

const segmentOf = (result: RenderResult, part: "start" | "end", type: string) =>
  [
    ...rowsOf(result)[part === "start" ? 0 : 1]!.querySelectorAll<HTMLElement>(
      "[data-slot='date-input-group-segment']",
    ),
  ].find((element) => element.dataset["type"] === type)!;

const open = async (result: RenderResult) => {
  await userEvent.click(triggerOf(result));
  await nextTick();
  await nextTick();
  await nextTick();

  const popover = popoverOf()!;

  await settled(popover);

  return popover;
};

const cellsOf = (popover: HTMLElement) => [
  ...popover.querySelectorAll<HTMLElement>("[data-slot='range-calendar-cell']"),
];

const cellOf = (popover: HTMLElement, day: number) =>
  cellsOf(popover).find(
    (element) => element.textContent?.trim() === String(day) && !element.dataset["outsideMonth"],
  )!;

const selectedDays = (popover: HTMLElement) =>
  cellsOf(popover)
    .filter((element) => element.dataset["selected"] === "true")
    .map((element) => element.textContent?.trim());

afterEach(async () => {
  /*
   * An open popover marks every sibling of its container `inert`, and Playwright will not click
   * through that — so a single failed assertion would read as every later test failing too.
   */
  if (popoverOf()) {
    await userEvent.keyboard("{Escape}");
    await nextTick();
    await nextTick();
  }

  mounted?.unmount();
  mounted = null;
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
    if (child.getAttribute("style") === "display: contents;") child.remove();
  }
});

/**
 * A range picker has two things a single picker does not, and neither can be read in jsdom: one row
 * of segments spanning two fields with a button between them, which arrow keys have to cross by
 * measuring rather than by counting; and a range built by pressing two days with a real pointer,
 * where the highlight follows the pointer between the two presses.
 */
describe("DateRangePicker (browser)", () => {
  describe("axe", () => {
    it("finds nothing to complain about while closed", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about with the calendar open", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });
      const popover = await open(result);

      await expectNoA11yViolations(popover, SHARED_WITH_REACT);
    });

    it("names the overlay, which react-aria-components leaves unnamed", async () => {
      const result = mount();
      const popover = await open(result);

      expect(popover.getAttribute("role")).toBe("dialog");
      expect(popover.getAttribute("aria-labelledby")).toBeTruthy();
    });
  });

  describe("one row of segments across two fields", () => {
    it("crosses from the last segment of one end to the first of the other", async () => {
      /*
       * The trigger sits between the two rows in the DOM. Arrow keys measure geometry rather than
       * counting tab stops, and the manager excludes the button — otherwise this lands on it.
       */
      const result = mount({ value: { end: jun(20), start: jun(10) } });

      segmentOf(result, "start", "year").focus();
      await userEvent.keyboard("{ArrowRight}");
      await nextTick();

      expect(document.activeElement).toBe(segmentOf(result, "end", "month"));
    });

    it("crosses back the other way", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });

      segmentOf(result, "end", "month").focus();
      await userEvent.keyboard("{ArrowLeft}");
      await nextTick();

      expect(document.activeElement).toBe(segmentOf(result, "start", "year"));
    });

    it("reaches both ends and the trigger by Tab alone", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });

      segmentOf(result, "start", "year").focus();
      await userEvent.keyboard("{Tab}");

      expect(document.activeElement).toBe(segmentOf(result, "end", "month"));

      await userEvent.keyboard("{Tab}{Tab}{Tab}");

      expect(document.activeElement).toBe(triggerOf(result));
    });
  });

  describe("a real pointer", () => {
    it("builds a range from two presses, and closes", async () => {
      const result = mount({ placeholderValue: jun(15) });
      const popover = await open(result);

      await userEvent.click(cellOf(popover, 10));
      await nextTick();
      await nextTick();

      // Still open: half a range is not a range, so nothing is committed and nothing closes.
      expect(popoverOf()).toBeTruthy();

      await userEvent.click(cellOf(popover, 14));
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
      expect(segmentOf(result, "start", "day").textContent?.trim()).toBe("10");
      expect(segmentOf(result, "end", "day").textContent?.trim()).toBe("14");
    });

    it("highlights the range under the pointer between the two presses", async () => {
      /*
       * The highlight follows the pointer, not the value — and it does so through `pointerenter` on
       * each cell, which a synthetic click never sends.
       */
      const result = mount({ placeholderValue: jun(15) });
      const popover = await open(result);

      await userEvent.click(cellOf(popover, 10));
      await nextTick();
      await userEvent.hover(cellOf(popover, 13));
      await nextTick();

      expect(selectedDays(popover)).toEqual(["10", "11", "12", "13"]);
    });

    it("closes on a press on the page behind it", async () => {
      const result = mount();
      const popover = await open(result);

      await userEvent.click(document.documentElement);
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
    });
  });

  describe("a real keyboard", () => {
    it("opens the calendar with Alt and an arrow from either end", async () => {
      const result = mount();

      segmentOf(result, "end", "month").focus();
      await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
      await nextTick();
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeTruthy();
    });

    it("takes focus into the calendar as it appears", async () => {
      const result = mount({ value: { end: jun(20), start: jun(10) } });
      const popover = await open(result);

      expect(popover.contains(document.activeElement)).toBe(true);
      expect((document.activeElement as HTMLElement).dataset["slot"]).toBe("range-calendar-cell");
    });

    it("hands focus back to the trigger after Escape", async () => {
      const result = mount();
      const popover = await open(result);

      await userEvent.keyboard("{Escape}");
      await settled(popover);
      await nextTick();
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(popoverOf()).toBeNull();
      expect(document.activeElement).toBe(triggerOf(result));
    });

    it("draws a visible focus ring on the trigger", async () => {
      // `status-focused` draws with a box shadow and sets `outline-style: none`.
      const result = mount();

      triggerOf(result).focus();
      await nextTick();

      expect(getComputedStyle(triggerOf(result)).boxShadow).not.toBe("none");
    });
  });
});
