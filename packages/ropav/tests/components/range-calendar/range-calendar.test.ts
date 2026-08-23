import type {DateRange} from "@/composables/use-calendar";
import type {DateValue} from "@internationalized/date";

import {CalendarDate} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

const renderRangeCalendar = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {
    props: {
      defaultFocusedValue: new CalendarDate(2026, 6, 15),
      locale: "en-US",
      ...props,
    },
  });
  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;
  const all = (name: string) => [
    ...result.container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
  ];

  return {
    ...result,
    all,

    /** One cell by the day number it shows. */
    cell: (day: number) =>
      all("range-calendar-cell").find((element) => element.textContent?.trim() === String(day))!,

    /** Every visible day cell, in DOM order. */
    cells: () => all("range-calendar-cell"),
    navButton: (direction: "previous" | "next") =>
      result.container.querySelector<HTMLElement>(
        `[data-slot='range-calendar-nav-button'][slot='${direction}']`,
      )!,
    root: () => slot("range-calendar"),
    slot,
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** The day numbers of every cell carrying an attribute, which is how a range is read back. */
const daysWith = (calendar: ReturnType<typeof renderRangeCalendar>, attribute: string) =>
  calendar
    .cells()
    .filter((cell) => cell.getAttribute(attribute) === "true")
    .map((cell) => Number(cell.textContent?.trim()));

describe("RangeCalendar", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const calendar = renderRangeCalendar({withCellIndicator: true, withYearPicker: true});

      for (const name of [
        "range-calendar",
        "range-calendar-header",
        "range-calendar-nav-button",
        "range-calendar-grid",
        "range-calendar-grid-header",
        "range-calendar-header-cell",
        "range-calendar-grid-body",
        "range-calendar-cell",
        "range-calendar-cell-button",
        "range-calendar-cell-indicator",
        "calendar-year-picker-trigger",
        "calendar-year-picker-grid",
      ]) {
        expect(calendar.slot(name), name).not.toBeNull();
      }

      calendar.unmount();
    });

    it("wraps every cell's content in a button element of its own", () => {
      // `Calendar.Cell` has no such wrapper; the range stylesheet keys the rounded ends on it.
      const calendar = renderRangeCalendar();
      const button = calendar.cell(15).querySelector("[data-slot='range-calendar-cell-button']");

      expect(button).not.toBeNull();
      expect(button!.className).toContain("range-calendar__cell-button");
      expect(button!.textContent?.trim()).toBe("15");
      calendar.unmount();
    });

    it("names itself and the grid after the dates on screen", () => {
      const calendar = renderRangeCalendar();

      expect(calendar.root().getAttribute("aria-label")).toBe("Stay, June 2026");
      expect(calendar.slot("range-calendar-grid").getAttribute("aria-label")).toBe(
        "Stay, June 2026",
      );
      calendar.unmount();
    });

    it("tells a screen reader the grid takes more than one date", () => {
      const calendar = renderRangeCalendar();

      expect(calendar.slot("range-calendar-grid").getAttribute("aria-multiselectable")).toBe(
        "true",
      );
      calendar.unmount();
    });

    it("casts a boolean written as a bare attribute", () => {
      // Without `type: Boolean` on the prop, `is-disabled` would arrive as `""` and read as falsy.
      const calendar = renderRangeCalendar({attributeForm: true});

      expect(calendar.root().getAttribute("data-disabled")).toBe("true");
      calendar.unmount();
    });
  });

  describe("classes", () => {
    it("puts every part's BEM class on it", () => {
      const calendar = renderRangeCalendar({withCellIndicator: true});

      expect(calendar.root().className).toContain("range-calendar");
      expect(calendar.slot("range-calendar-header").className).toContain("range-calendar__header");
      expect(calendar.slot("range-calendar-grid").className).toContain("range-calendar__grid");
      expect(calendar.slot("range-calendar-cell").className).toContain("range-calendar__cell");
      expect(calendar.slot("range-calendar-cell-indicator").className).toContain(
        "range-calendar__cell-indicator",
      );
      calendar.unmount();
    });

    it("marks a week view and a day view on the root", () => {
      const week = renderRangeCalendar({visibleDuration: {weeks: 1}});

      expect(week.root().className).toContain("range-calendar--week-view");
      week.unmount();

      const day = renderRangeCalendar({visibleDuration: {days: 3}});

      expect(day.root().className).toContain("range-calendar--day-view");
      day.unmount();
    });

    it("keeps a caller's class alongside its own", () => {
      const calendar = renderRangeCalendar({class: "mine"});

      expect(calendar.root().className).toContain("mine");
      expect(calendar.root().className).toContain("range-calendar");
      calendar.unmount();
    });
  });

  describe("state attributes", () => {
    it("marks every date in the selected range", () => {
      const calendar = renderRangeCalendar({value: {end: jun(14), start: jun(10)}});

      expect(daysWith(calendar, "data-selected")).toEqual([10, 11, 12, 13, 14]);
      calendar.unmount();
    });

    it("marks the two ends apart from the middle", () => {
      const calendar = renderRangeCalendar({value: {end: jun(14), start: jun(10)}});

      expect(daysWith(calendar, "data-selection-start")).toEqual([10]);
      expect(daysWith(calendar, "data-selection-end")).toEqual([14]);
      calendar.unmount();
    });

    it("marks only the two ends on the wrapper the stylesheet rounds", () => {
      const calendar = renderRangeCalendar({value: {end: jun(14), start: jun(10)}});
      const marked = calendar
        .all("range-calendar-cell-button")
        .filter((button) => button.getAttribute("data-selected") === "true")
        .map((button) => Number(button.textContent?.trim()));

      expect(marked).toEqual([10, 14]);
      calendar.unmount();
    });

    it("leaves both end attributes off when nothing is selected", () => {
      const calendar = renderRangeCalendar();

      expect(calendar.cell(15).getAttribute("data-selection-start")).toBeNull();
      expect(calendar.cell(15).getAttribute("data-selection-end")).toBeNull();
      calendar.unmount();
    });

    it("marks a date outside the visible month", () => {
      const calendar = renderRangeCalendar();

      expect(calendar.cells()[0]?.getAttribute("data-outside-month")).toBe("true");
      expect(calendar.cells()[0]?.getAttribute("data-outside-visible-range")).toBe("true");
      calendar.unmount();
    });

    it("marks a disabled and an unavailable date apart", () => {
      const calendar = renderRangeCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 16,
        minValue: jun(10),
      });

      expect(calendar.cell(9).getAttribute("data-disabled")).toBe("true");
      expect(calendar.cell(16).getAttribute("data-unavailable")).toBe("true");
      expect(calendar.cell(16).getAttribute("data-disabled")).toBeNull();
      calendar.unmount();
    });

    it("marks the calendar invalid when an end of its range is unavailable", () => {
      // Only the two ends count: a range spanning an unavailable date in the middle is refused
      // while it is being built, so a value that reached here cannot be one.
      const calendar = renderRangeCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 10,
        value: {end: jun(14), start: jun(10)},
      });

      expect(calendar.root().getAttribute("data-invalid")).toBe("true");
      expect(daysWith(calendar, "data-invalid")).toEqual([10, 11, 12, 13, 14]);
      calendar.unmount();
    });

    it("stays valid when only a date in the middle of the range is unavailable", () => {
      const calendar = renderRangeCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 12,
        value: {end: jun(14), start: jun(10)},
      });

      expect(calendar.root().getAttribute("data-invalid")).toBeNull();
      calendar.unmount();
    });

    it("marks hover on a cell", async () => {
      const calendar = renderRangeCalendar();

      calendar
        .cell(15)
        .dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();
      expect(calendar.cell(15).getAttribute("data-hovered")).toBe("true");
      calendar.unmount();
    });
  });

  describe("picking a range", () => {
    it("takes two presses, and only emits on the second", async () => {
      const onValueChange = vi.fn();
      const calendar = renderRangeCalendar({onValueChange});

      calendar.cell(10).click();
      await nextTick();

      expect(onValueChange).not.toHaveBeenCalled();
      expect(daysWith(calendar, "data-selected")).toEqual([10]);

      calendar.cell(14).click();
      await nextTick();

      const emitted = onValueChange.mock.lastCall![0] as DateRange;

      expect(`${emitted.start}..${emitted.end}`).toBe("2026-06-10..2026-06-14");
      expect(daysWith(calendar, "data-selected")).toEqual([10, 11, 12, 13, 14]);
      calendar.unmount();
    });

    it("follows the pointer between the two presses", async () => {
      const calendar = renderRangeCalendar();

      calendar.cell(10).click();
      calendar
        .cell(14)
        .dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();

      expect(daysWith(calendar, "data-selected")).toEqual([10, 11, 12, 13, 14]);
      calendar.unmount();
    });

    it("refuses to pick anything while read only", async () => {
      const onValueChange = vi.fn();
      const calendar = renderRangeCalendar({isReadOnly: true, onValueChange});

      calendar.cell(10).click();
      calendar.cell(14).click();
      await nextTick();

      expect(onValueChange).not.toHaveBeenCalled();
      expect(daysWith(calendar, "data-selected")).toEqual([]);
      calendar.unmount();
    });

    it("stops a range at the nearest unavailable date on either side", async () => {
      const calendar = renderRangeCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 12 || date.day === 18,
      });

      calendar.cell(15).click();
      await nextTick();

      expect(calendar.cell(13).getAttribute("data-disabled")).toBeNull();
      expect(calendar.cell(11).getAttribute("data-disabled")).toBe("true");
      expect(calendar.cell(19).getAttribute("data-disabled")).toBe("true");
      calendar.unmount();
    });

    it("lifts that limit when non-contiguous ranges are allowed", async () => {
      const calendar = renderRangeCalendar({
        allowsNonContiguousRanges: true,
        isDateUnavailable: (date: DateValue) => date.day === 12 || date.day === 18,
      });

      calendar.cell(15).click();
      await nextTick();

      expect(calendar.cell(11).getAttribute("data-disabled")).toBeNull();
      expect(calendar.cell(19).getAttribute("data-disabled")).toBeNull();
      calendar.unmount();
    });
  });

  describe("navigating", () => {
    it("pages a month with the nav buttons", async () => {
      const calendar = renderRangeCalendar();

      calendar.navButton("next").click();
      await nextTick();
      expect(calendar.slot("range-calendar-heading").textContent).toBe("July 2026");

      calendar.navButton("previous").click();
      await nextTick();
      expect(calendar.slot("range-calendar-heading").textContent).toBe("June 2026");
      calendar.unmount();
    });

    it("moves focus with the arrow keys", async () => {
      const calendar = renderRangeCalendar();

      calendar.cell(15).focus();
      calendar
        .slot("range-calendar-grid")
        .dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowRight"}));
      await nextTick();

      expect(calendar.cell(16).getAttribute("data-focused")).toBe("true");
      calendar.unmount();
    });

    it("emits update:yearPickerOpen when the year picker is opened", async () => {
      const onUpdate = vi.fn();
      const calendar = renderRangeCalendar({
        "onUpdate:yearPickerOpen": onUpdate,
        withYearPicker: true,
      });

      calendar.slot("calendar-year-picker-trigger").click();
      await nextTick();

      // No fixture forwarding needed here: the emit is `update:yearPickerOpen` while the bound
      // prop is `isYearPickerOpen`, so the names do not collide and fallthrough delivers it.
      expect(onUpdate).toHaveBeenCalledWith(true);
      calendar.unmount();
    });

    it("emits update:focusedValue when the arrow keys move focus", async () => {
      const onUpdate = vi.fn();
      const calendar = renderRangeCalendar({"onUpdate:focusedValue": onUpdate});

      calendar.cell(15).focus();
      calendar
        .slot("range-calendar-grid")
        .dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowRight"}));
      await nextTick();

      expect(String(onUpdate.mock.lastCall![0])).toBe("2026-06-16");
      calendar.unmount();
    });

    it("takes a range from the keyboard", async () => {
      const onValueChange = vi.fn();
      const calendar = renderRangeCalendar({onValueChange});
      const grid = calendar.slot("range-calendar-grid");

      calendar.cell(15).focus();
      grid.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
      await nextTick();
      grid.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "ArrowRight"}));
      await nextTick();
      grid.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
      await nextTick();

      const emitted = onValueChange.mock.lastCall![0] as DateRange;

      expect(`${emitted.start}..${emitted.end}`).toBe("2026-06-15..2026-06-16");
      calendar.unmount();
    });

    it("abandons a half-built range on Escape", async () => {
      const calendar = renderRangeCalendar();
      const grid = calendar.slot("range-calendar-grid");

      calendar.cell(10).click();
      await nextTick();
      expect(daysWith(calendar, "data-selected")).toEqual([10]);

      grid.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Escape"}));
      await nextTick();

      expect(daysWith(calendar, "data-selected")).toEqual([]);
      calendar.unmount();
    });

    it("shows two months side by side", () => {
      const calendar = renderRangeCalendar({
        visibleDuration: {months: 2},
        withSecondMonth: true,
      });
      const headings = calendar.all("range-calendar-grid");

      expect(headings).toHaveLength(2);
      calendar.unmount();
    });
  });

  describe("the hidden helpers a screen reader needs", () => {
    it("repeats the calendar's own name before everything else", () => {
      // VoiceOver on iOS does not announce a grid's label, so the name is stated here as well.
      const calendar = renderRangeCalendar();

      expect(calendar.root().firstElementChild?.textContent).toBe("Stay, June 2026");
      calendar.unmount();
    });

    it("adds a second next button after the grid, typed so it cannot submit a form", () => {
      const calendar = renderRangeCalendar();
      const hidden = calendar.root().lastElementChild?.querySelector("button");

      expect(hidden?.getAttribute("aria-label")).toBe("Next");
      expect(hidden?.getAttribute("type")).toBe("button");
      calendar.unmount();
    });
  });
});
