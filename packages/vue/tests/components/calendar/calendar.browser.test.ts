import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const jun = (day: number) => new CalendarDate(2026, 6, day);

/**
 * Three rules react-aria's own build fails in exactly the same places, measured on both sides with
 * axe against the same markup.
 *
 * `color-contrast`: a weekday name, and a selected cell, are below 4.5:1 against what they sit on.
 * `landmark-banner-is-top-level`: `Calendar.Header` renders a `<header>`, which is a banner
 * landmark, and a calendar is rarely the top level of a page.
 * `aria-required-children`: the year picker's grid is a `listbox` whose children are cells rather
 * than `option`s.
 *
 * All three live in `@heroui/styles` and in HeroUI's own component shape rather than in this port,
 * so they are excluded here and recorded as debt instead of being absorbed into a green gate.
 */
const SHARED_WITH_REACT = {
  rules: {
    "aria-required-children": {enabled: false},
    "color-contrast": {enabled: false},
    "landmark-banner-is-top-level": {enabled: false},
  },
};

const render = (props: Record<string, unknown> = {}) =>
  renderVapor(Fixture, {
    props: {ariaLabel: "Event date", defaultFocusedValue: jun(15), locale: "en-US", ...props},
  });

type RenderResult = ReturnType<typeof render>;

let mounted: RenderResult | null = null;

const mount = (props: Record<string, unknown> = {}) => {
  mounted = render(props);

  return mounted;
};

const cellsOf = (result: RenderResult) => [
  ...result.container.querySelectorAll<HTMLElement>("[data-slot='calendar-cell']"),
];

const cellOf = (result: RenderResult, day: number) =>
  cellsOf(result).find(
    (element) => element.textContent?.trim() === String(day) && !element.dataset["outsideMonth"],
  )!;

const navButtonOf = (result: RenderResult, direction: "previous" | "next") =>
  result.container.querySelector<HTMLElement>(
    `[data-slot='calendar-nav-button'][slot='${direction}']`,
  )!;

const activeLabel = () =>
  (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? "";

afterEach(() => {
  mounted?.unmount();
  mounted = null;
});

/**
 * A calendar is a grid driven entirely by keys, and its focus lives on whichever cell the state says
 * holds it. jsdom can dispatch a key but it has no layout, so it cannot answer whether the ring is
 * drawn, whether focus survives paging, or whether the year picker lands over the grid it replaces.
 */
describe("Calendar (browser)", () => {
  describe("axe", () => {
    it("finds nothing to complain about", async () => {
      const result = mount({value: jun(10)});

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about with the year picker open", async () => {
      const result = mount({defaultYearPickerOpen: true, withYearPicker: true});

      await nextTick();
      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });

    it("finds nothing to complain about while disabled", async () => {
      const result = mount({isDisabled: true, value: jun(10)});

      await expectNoA11yViolations(result.container, SHARED_WITH_REACT);
    });
  });

  describe("a real keyboard", () => {
    it("moves a day at a time with the arrow keys", async () => {
      const result = mount({value: jun(10)});

      cellOf(result, 10).focus();
      await userEvent.keyboard("{ArrowRight}");
      await nextTick();

      expect(activeLabel()).toContain("June 11");

      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      await nextTick();

      expect(activeLabel()).toContain("June 9");
    });

    it("moves a week at a time with up and down", async () => {
      const result = mount({value: jun(10)});

      cellOf(result, 10).focus();
      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      expect(activeLabel()).toContain("June 17");

      await userEvent.keyboard("{ArrowUp}");
      await nextTick();

      expect(activeLabel()).toContain("June 10");
    });

    it("jumps to the ends of the month with Home and End", async () => {
      /*
       * The ends of the *section* on screen, which for a month view is the month — not the week.
       * A week view is where Home and End mean the ends of a week.
       */
      const result = mount({value: jun(10)});

      cellOf(result, 10).focus();
      await userEvent.keyboard("{Home}");
      await nextTick();

      expect(activeLabel()).toContain("June 1");

      await userEvent.keyboard("{End}");
      await nextTick();

      expect(activeLabel()).toContain("June 30");
    });

    it("jumps to the ends of the week in a week view", async () => {
      // The week on screen is the one the focused date is in, so June has to be where it starts.
      const result = mount({
        defaultFocusedValue: jun(10),
        value: jun(10),
        visibleDuration: {weeks: 1},
      });

      cellOf(result, 10).focus();
      await userEvent.keyboard("{Home}");
      await nextTick();

      // June 10 2026 is a Wednesday, and the week starts on Sunday in en-US.
      expect(activeLabel()).toContain("June 7");

      await userEvent.keyboard("{End}");
      await nextTick();

      expect(activeLabel()).toContain("June 13");
    });

    it("pages by a month, keeping focus on a cell", async () => {
      const result = mount({value: jun(10)});

      cellOf(result, 10).focus();
      await userEvent.keyboard("{PageDown}");
      await nextTick();
      await nextTick();

      expect(activeLabel()).toContain("July 10");
      // Focus never falls to the document: the cell holding it is in the batch just rendered.
      expect(document.activeElement?.getAttribute("data-slot")).toBe("calendar-cell");

      await userEvent.keyboard("{PageUp}");
      await nextTick();
      await nextTick();

      expect(activeLabel()).toContain("June 10");
    });

    it("chooses the focused day with Enter", async () => {
      const result = mount({defaultValue: jun(10)});

      cellOf(result, 10).focus();
      await userEvent.keyboard("{ArrowRight}");
      await nextTick();
      await userEvent.keyboard("{Enter}");
      await nextTick();

      expect(cellOf(result, 11).dataset["selected"]).toBe("true");
      expect(cellOf(result, 10).dataset["selected"]).toBeUndefined();
    });

    it("draws a visible focus ring on the focused cell", async () => {
      /*
       * `status-focused` draws with a box shadow and sets `outline-style: none`, so the outline is
       * the wrong thing to read — and reading it is how a missing ring passes unnoticed.
       */
      const result = mount({value: jun(10)});
      const cell = cellOf(result, 10);

      cell.focus();
      await nextTick();

      expect(getComputedStyle(cell).boxShadow).not.toBe("none");
    });

    it("keeps every cell out of the tab order but the one that holds focus", async () => {
      /*
       * A grid is one tab stop: Tab leaves it, and the arrow keys move inside it. The stop is the
       * *focused* date, which is not the selected one — nothing here has been chosen yet.
       */
      const result = mount({defaultFocusedValue: jun(10)});
      const tabbable = cellsOf(result).filter((cell) => cell.getAttribute("tabindex") === "0");

      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]?.textContent?.trim()).toBe("10");
    });
  });

  describe("a real pointer", () => {
    /**
     * A synthetic pointer proves nothing about press: it arrives with no `pointerenter` ahead of it
     * and triggers no re-render mid-dispatch, which is the shape of the bug that once left a
     * dropdown unopenable by mouse while every test stayed green.
     */
    it("chooses a day", async () => {
      const result = mount({defaultValue: jun(10)});

      await userEvent.click(cellOf(result, 18));
      await nextTick();

      expect(cellOf(result, 18).dataset["selected"]).toBe("true");
    });

    it("pages with the nav buttons", async () => {
      const result = mount({value: jun(10)});

      await userEvent.click(navButtonOf(result, "next"));
      await nextTick();
      await nextTick();

      expect(result.container.querySelector("[data-slot='calendar-heading']")?.textContent).toBe(
        "July 2026",
      );

      await userEvent.click(navButtonOf(result, "previous"));
      await nextTick();
      await nextTick();

      expect(result.container.querySelector("[data-slot='calendar-heading']")?.textContent).toBe(
        "June 2026",
      );
    });

    it("leaves a disabled day alone", async () => {
      const result = mount({minValue: jun(10), value: jun(15)});
      const before = cellOf(result, 15).dataset["selected"];

      await userEvent.click(cellOf(result, 5), {force: true});
      await nextTick();

      expect(cellOf(result, 15).dataset["selected"]).toBe(before);
    });
  });

  describe("the year picker", () => {
    it("lays itself over the grid it stands in for", async () => {
      /*
       * The only part of this package that measures one element to place another: the year grid
       * reads the day grid's own `offsetTop` and `offsetHeight`. Both are zero without layout.
       */
      const result = mount({withYearPicker: true});

      await userEvent.click(
        result.container.querySelector<HTMLElement>("[data-slot='calendar-year-picker-trigger']")!,
      );
      await nextTick();
      await nextTick();

      const grid = result.container.querySelector<HTMLElement>("[data-slot='calendar-grid']")!;
      const years = result.container.querySelector<HTMLElement>(
        "[data-slot='calendar-year-picker-grid']",
      )!;

      expect(years.style.top).toBe(`${grid.offsetTop}px`);
      expect(years.style.height).toBe(`${grid.offsetHeight}px`);
      expect(grid.offsetHeight).toBeGreaterThan(0);
    });

    it("takes focus onto a year as it opens", async () => {
      const result = mount({value: jun(10), withYearPicker: true});

      await userEvent.click(
        result.container.querySelector<HTMLElement>("[data-slot='calendar-year-picker-trigger']")!,
      );
      await nextTick();
      await nextTick();
      // The focus is moved in an animation frame, once the grid it belongs to has been laid out.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(document.activeElement?.getAttribute("data-year")).toBe("2026");
    });
  });
});
