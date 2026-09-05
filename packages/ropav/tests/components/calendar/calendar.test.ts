import type { DateValue } from "@internationalized/date";

import { CalendarDate, createCalendar } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderCalendar = (props: Record<string, unknown> = {}) => {
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
      all("calendar-cell").find((element) => element.textContent?.trim() === String(day))!,

    /** Every visible day cell, in DOM order. */
    cells: () => all("calendar-cell"),
    navButton: (direction: "previous" | "next") =>
      result.container.querySelector<HTMLElement>(
        `[data-slot='calendar-nav-button'][slot='${direction}']`,
      )!,
    root: () => slot("calendar"),
    slot,
    years: () => all("calendar-year-picker-year-cell"),
  };
};

describe("Calendar", () => {
  // The current-year tests pin the clock, and a fake one left running would reach the tests after.
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const calendar = renderCalendar({ withCellIndicator: true, withYearPicker: true });

      for (const name of [
        "calendar",
        "calendar-header",
        "calendar-nav-button",
        "calendar-grid",
        "calendar-grid-header",
        "calendar-header-cell",
        "calendar-grid-body",
        "calendar-cell",
        "calendar-cell-indicator",
        "calendar-year-picker-trigger",
        "calendar-year-picker-trigger-heading",
        "calendar-year-picker-trigger-indicator",
        "calendar-year-picker-grid",
        "calendar-year-picker-year-cell",
      ]) {
        expect(calendar.slot(name), name).not.toBeNull();
      }

      calendar.unmount();
    });

    it("renders a heading when there is no year picker", () => {
      const calendar = renderCalendar();

      expect(calendar.slot("calendar-heading").textContent).toBe("June 2026");
      // The visible range is already announced by the calendar itself, so the heading is silent.
      expect(calendar.slot("calendar-heading").getAttribute("aria-hidden")).toBe("true");
      calendar.unmount();
    });

    it("builds the grid as a table with a header row and week rows", () => {
      const calendar = renderCalendar();
      const grid = calendar.slot("calendar-grid");

      expect(grid.tagName).toBe("TABLE");
      expect(calendar.all("calendar-header-cell")).toHaveLength(7);
      expect(grid.querySelectorAll("tbody tr")).toHaveLength(5);
      calendar.unmount();
    });

    it("writes the weekday names at the requested width", () => {
      const calendar = renderCalendar({ weekdayStyle: "long" });

      expect(calendar.all("calendar-header-cell")[0]?.textContent?.trim()).toBe("Sunday");
      calendar.unmount();
    });

    it("fills the cells with the day numbers", () => {
      const calendar = renderCalendar();

      // June 2026 starts on a Monday, so the grid opens with 31 May.
      expect(calendar.cells()[0]?.textContent?.trim()).toBe("31");
      expect(calendar.cell(15)).toBeDefined();
      calendar.unmount();
    });

    it("gives a second grid its own month", () => {
      const calendar = renderCalendar({
        visibleDuration: { months: 2 },
        withSecondMonth: true,
      });
      const grids = calendar.all("calendar-grid");

      expect(grids).toHaveLength(2);
      expect(grids[0]?.getAttribute("aria-label")).toBe("Event date, June 2026");
      expect(grids[1]?.getAttribute("aria-label")).toBe("Event date, July 2026");
      calendar.unmount();
    });

    it("takes a bare boolean attribute", () => {
      // `:is-disabled="true"` stays green while the prop is declared through an imported indexed
      // type, so the attribute form is the one that has to be asserted.
      const calendar = renderCalendar({ attributeForm: true });

      expect(calendar.root().getAttribute("data-disabled")).toBe("true");
      calendar.unmount();
    });
  });

  describe("classes", () => {
    it("puts every part's BEM class on it", () => {
      const calendar = renderCalendar({ withCellIndicator: true });

      expect(calendar.root().className).toContain("rp-calendar");
      expect(calendar.slot("calendar-header").className).toContain("rp-calendar__header");
      expect(calendar.slot("calendar-grid").className).toContain("rp-calendar__grid");
      expect(calendar.slot("calendar-cell").className).toContain("rp-calendar__cell");
      expect(calendar.slot("calendar-cell-indicator").className).toContain(
        "rp-calendar__cell-indicator",
      );
      calendar.unmount();
    });

    it("marks a week view and a day view on the root", () => {
      // The stylesheet lays a single row out differently from a month grid, keyed on these.
      const week = renderCalendar({ visibleDuration: { weeks: 1 } });

      expect(week.root().className).toContain("rp-calendar--week-view");
      week.unmount();

      const day = renderCalendar({ visibleDuration: { days: 3 } });

      expect(day.root().className).toContain("rp-calendar--day-view");
      day.unmount();
    });

    it("keeps a caller's class alongside its own", () => {
      const calendar = renderCalendar({ class: "mine" });

      expect(calendar.root().className).toContain("mine");
      expect(calendar.root().className).toContain("rp-calendar");
      calendar.unmount();
    });
  });

  describe("state attributes", () => {
    it("marks the selected date", () => {
      const calendar = renderCalendar({ value: new CalendarDate(2026, 6, 10) });

      expect(calendar.cell(10).getAttribute("data-selected")).toBe("true");
      expect(calendar.cell(11).getAttribute("data-selected")).toBeNull();
      calendar.unmount();
    });

    it("marks a date outside the visible month", () => {
      const calendar = renderCalendar();

      expect(calendar.cells()[0]?.getAttribute("data-outside-month")).toBe("true");
      expect(calendar.cells()[0]?.getAttribute("data-outside-visible-range")).toBe("true");
      calendar.unmount();
    });

    it("marks a disabled and an unavailable date apart", () => {
      const calendar = renderCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 16,
        minValue: new CalendarDate(2026, 6, 10),
      });

      expect(calendar.cell(9).getAttribute("data-disabled")).toBe("true");
      expect(calendar.cell(16).getAttribute("data-unavailable")).toBe("true");
      expect(calendar.cell(16).getAttribute("data-disabled")).toBeNull();
      calendar.unmount();
    });

    it("marks the calendar invalid when its selection is", () => {
      const calendar = renderCalendar({
        isDateUnavailable: (date: DateValue) => date.day === 10,
        value: new CalendarDate(2026, 6, 10),
      });

      expect(calendar.root().getAttribute("data-invalid")).toBe("true");
      expect(calendar.cell(10).getAttribute("data-invalid")).toBe("true");
      calendar.unmount();
    });

    it("marks hover on a cell", async () => {
      const calendar = renderCalendar();

      calendar
        .cell(15)
        .dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
      await nextTick();
      expect(calendar.cell(15).getAttribute("data-hovered")).toBe("true");

      calendar
        .cell(15)
        .dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }));
      await nextTick();
      expect(calendar.cell(15).getAttribute("data-hovered")).toBeNull();
      calendar.unmount();
    });
  });

  describe("navigating", () => {
    it("pages a month with the nav buttons", async () => {
      const calendar = renderCalendar();

      calendar.navButton("next").click();
      await nextTick();
      expect(calendar.slot("calendar-heading").textContent).toBe("July 2026");

      calendar.navButton("previous").click();
      await nextTick();
      expect(calendar.slot("calendar-heading").textContent).toBe("June 2026");
      calendar.unmount();
    });

    it("disables the direction a bound closes off", () => {
      const calendar = renderCalendar({
        maxValue: new CalendarDate(2026, 6, 30),
        minValue: new CalendarDate(2026, 6, 1),
      });

      expect(calendar.navButton("previous").hasAttribute("disabled")).toBe(true);
      expect(calendar.navButton("next").hasAttribute("disabled")).toBe(true);
      calendar.unmount();
    });

    it("moves focus with the arrow keys", async () => {
      const calendar = renderCalendar({ autoFocus: true });

      await nextTick();
      expect(document.activeElement).toBe(calendar.cell(15));

      calendar
        .slot("calendar-grid")
        .dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
        );
      await nextTick();

      expect(document.activeElement).toBe(calendar.cell(16));
      calendar.unmount();
    });

    it("emits update:focusedValue when the arrow keys move focus", async () => {
      const onUpdate = vi.fn();
      const calendar = renderCalendar({ "onUpdate:focusedValue": onUpdate });

      calendar.cell(15).focus();
      calendar
        .slot("calendar-grid")
        .dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
        );
      await nextTick();

      expect(String(onUpdate.mock.lastCall![0])).toBe("2026-06-16");
      calendar.unmount();
    });

    it("selects a date when a cell is pressed", async () => {
      const onValueChange = vi.fn();
      const calendar = renderCalendar({ "onUpdate:value": onValueChange });

      calendar.cell(20).click();
      await nextTick();

      expect(String(onValueChange.mock.calls[0]?.[0])).toBe("2026-06-20");
      expect(calendar.cell(20).getAttribute("data-selected")).toBe("true");
      calendar.unmount();
    });

    it("selects with Enter on the focused cell", async () => {
      const onValueChange = vi.fn();
      const calendar = renderCalendar({ "onUpdate:value": onValueChange });

      calendar
        .slot("calendar-grid")
        .dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
        );
      await nextTick();

      expect(String(onValueChange.mock.calls[0]?.[0])).toBe("2026-06-15");
      calendar.unmount();
    });

    it("selects nothing while read only", async () => {
      const onValueChange = vi.fn();
      const calendar = renderCalendar({ isReadOnly: true, "onUpdate:value": onValueChange });

      calendar.cell(20).click();
      await nextTick();

      expect(onValueChange).not.toHaveBeenCalled();
      calendar.unmount();
    });
  });

  describe("the hidden helpers a screen reader needs", () => {
    it("repeats the calendar's name in a heading before everything else", () => {
      // VoiceOver on iOS does not announce a grid's own label, so the name is stated up front.
      const calendar = renderCalendar();
      const heading = calendar.root().querySelector("h2");

      expect(heading?.textContent).toBe("Event date, June 2026");
      expect(calendar.root().firstElementChild?.contains(heading!)).toBe(true);
      calendar.unmount();
    });

    it("adds a second next button after the grid", () => {
      const calendar = renderCalendar();
      const buttons = [...calendar.root().querySelectorAll("button")];
      const last = buttons.at(-1)!;

      expect(last.getAttribute("aria-label")).toBe("Next");
      expect(last.getAttribute("tabindex")).toBe("-1");
      calendar.unmount();
    });

    it("pages from the hidden next button too", async () => {
      const calendar = renderCalendar();
      const buttons = [...calendar.root().querySelectorAll("button")];

      buttons.at(-1)!.click();
      await nextTick();

      expect(calendar.slot("calendar-heading").textContent).toBe("July 2026");
      calendar.unmount();
    });
  });

  describe("the year picker", () => {
    it("stays closed until its trigger is pressed", async () => {
      const calendar = renderCalendar({ withYearPicker: true });
      const trigger = calendar.slot("calendar-year-picker-trigger");
      const grid = calendar.slot("calendar-year-picker-grid");

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(grid.getAttribute("aria-hidden")).toBe("true");

      trigger.click();
      await nextTick();

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(trigger.getAttribute("data-open")).toBe("true");
      // Still stated rather than dropped, as upstream does: a hidden grid that stops saying so
      // reads to a screen reader as one that was never hidden.
      expect(grid.getAttribute("aria-hidden")).toBe("false");
      calendar.unmount();
    });

    it("names the trigger after the month it shows", () => {
      const calendar = renderCalendar({ withYearPicker: true });

      expect(calendar.slot("calendar-year-picker-trigger").getAttribute("aria-label")).toBe(
        "June 2026, year selector",
      );
      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent?.trim()).toBe(
        "June 2026",
      );
      calendar.unmount();
    });

    it("offers every year between the calendar's bounds", () => {
      const calendar = renderCalendar({
        maxValue: new CalendarDate(2028, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });

      expect(calendar.years().map((cell) => cell.dataset["year"])).toEqual([
        "2024",
        "2025",
        "2026",
        "2027",
        "2028",
      ]);
      calendar.unmount();
    });

    it("marks the year the calendar is on", () => {
      const calendar = renderCalendar({
        maxValue: new CalendarDate(2028, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });
      const selected = calendar.years().filter((cell) => cell.dataset["selected"] === "true");

      expect(selected.map((cell) => cell.dataset["year"])).toEqual(["2026"]);
      calendar.unmount();
    });

    it("marks the year today falls in", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

      const calendar = renderCalendar({
        defaultFocusedValue: new CalendarDate(2024, 6, 15),
        maxValue: new CalendarDate(2028, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });
      // The body writes its flag onto the cell, the cell writes its own inside.
      const marked = (selector: string) =>
        calendar
          .years()
          .filter((cell) => cell.matches(selector) || cell.querySelector(selector) !== null)
          .map((cell) => cell.dataset["year"]);

      // 2024 is focused, so a year marked here is today's rather than the selected one.
      expect(marked("[data-body-current-year]")).toEqual(["2026"]);
      expect(marked("[data-cell-current-year]")).toEqual(["2026"]);
      calendar.unmount();
    });

    it("moves the calendar to a year and closes", async () => {
      const calendar = renderCalendar({
        defaultYearPickerOpen: true,
        maxValue: new CalendarDate(2028, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });

      calendar
        .years()
        .find((cell) => cell.dataset["year"] === "2027")!
        .click();
      await nextTick();

      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent?.trim()).toBe(
        "June 2027",
      );
      expect(calendar.slot("calendar-year-picker-trigger").getAttribute("aria-expanded")).toBe(
        "false",
      );
      calendar.unmount();
    });

    it("keeps every year but the active one out of the tab order", async () => {
      const calendar = renderCalendar({
        maxValue: new CalendarDate(2028, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });

      // Closed: the whole grid is unreachable, or Tab would walk through a hidden list.
      expect(calendar.years().every((cell) => cell.getAttribute("tabindex") === "-1")).toBe(true);

      calendar.slot("calendar-year-picker-trigger").click();
      await nextTick();

      const reachable = calendar.years().filter((cell) => cell.getAttribute("tabindex") !== "-1");

      expect(reachable.map((cell) => cell.dataset["year"])).toEqual(["2026"]);
      calendar.unmount();
    });

    it("closes on Escape", async () => {
      const calendar = renderCalendar({ defaultYearPickerOpen: true, withYearPicker: true });
      const grid = calendar.slot("calendar-year-picker-grid");

      grid.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
      await nextTick();

      expect(grid.getAttribute("aria-hidden")).toBe("true");
      calendar.unmount();
    });

    it("walks the years with the arrow keys, three to a row", async () => {
      const calendar = renderCalendar({
        defaultYearPickerOpen: true,
        maxValue: new CalendarDate(2030, 12, 31),
        minValue: new CalendarDate(2024, 1, 1),
        withYearPicker: true,
      });
      const grid = calendar.slot("calendar-year-picker-grid");
      const press = (key: string) =>
        grid.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
      const active = () =>
        calendar.years().find((cell) => cell.getAttribute("tabindex") !== "-1")?.dataset["year"];

      expect(active()).toBe("2026");

      press("ArrowRight");
      await nextTick();
      expect(active()).toBe("2027");

      press("ArrowDown");
      await nextTick();
      expect(active()).toBe("2030");

      press("Home");
      await nextTick();
      expect(active()).toBe("2024");

      press("End");
      await nextTick();
      expect(active()).toBe("2030");
      calendar.unmount();
    });

    it("reports opening and closing to its owner", async () => {
      const onYearPickerOpenChange = vi.fn();
      const calendar = renderCalendar({
        "onUpdate:yearPickerOpen": onYearPickerOpenChange,
        withYearPicker: true,
      });

      calendar.slot("calendar-year-picker-trigger").click();
      await nextTick();

      expect(onYearPickerOpenChange).toHaveBeenCalledWith(true);
      calendar.unmount();
    });
  });

  describe("the calendar system", () => {
    /*
     * Gregorian whatever the locale asks for. The full factory carries the arithmetic for every
     * system behind it, and a static default would put all of them in every build.
     */
    it.each([
      ["th-TH-u-ca-buddhist", "2026"],
      ["ja-JP-u-ca-japanese", "2026"],
      ["hi-IN-u-ca-indian", "2026"],
    ])("builds Gregorian for %s until a factory is passed", (locale, year) => {
      const calendar = renderCalendar({ locale, withYearPicker: true });

      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent).toContain(year);
      calendar.unmount();
    });

    it("takes the locale's own system once the factory is passed", () => {
      const calendar = renderCalendar({
        createCalendar,
        locale: "th-TH-u-ca-buddhist",
        withYearPicker: true,
      });

      // 2026 Gregorian is 2569 in the Buddhist calendar.
      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent).toContain("2569");
      calendar.unmount();
    });

    it("asks the passed factory for the identifier the locale resolves to", () => {
      const createSpy = vi.fn(createCalendar);
      const calendar = renderCalendar({ createCalendar: createSpy, locale: "th-TH-u-ca-buddhist" });

      expect(createSpy).toHaveBeenCalledWith("buddhist");
      calendar.unmount();
    });

    /*
     * A Japanese year is counted from the start of an era, so the default bounds cannot be
     * assembled from the numbers 1900 and 2099 — that reads as the 1900th year of Reiwa, and the
     * focused date used to be dragged two millennia forward to meet it.
     */
    it("holds the focused date inside bounds an era changes inside", () => {
      const calendar = renderCalendar({
        createCalendar,
        locale: "ja-JP-u-ca-japanese",
        withYearPicker: true,
      });

      // 2026 Gregorian is Reiwa 8.
      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent?.trim()).toBe(
        "令和8年6月",
      );
      calendar.unmount();
    });

    it("offers the eras the default bounds actually run through", () => {
      const calendar = renderCalendar({
        createCalendar,
        locale: "ja-JP-u-ca-japanese",
        withYearPicker: true,
      });
      const labels = calendar.years().map((cell) => cell.textContent?.trim());

      // 1900 is Meiji 33 and 2099 is Reiwa 81, four era changes apart.
      expect(labels).toHaveLength(200);
      expect(labels.at(0)).toBe("明治33年");
      expect(labels.at(-1)).toBe("令和81年");
      calendar.unmount();
    });

    it("marks one year when the same number falls in several eras", () => {
      const calendar = renderCalendar({
        createCalendar,
        locale: "ja-JP-u-ca-japanese",
        withYearPicker: true,
      });
      const selected = calendar.years().filter((cell) => cell.dataset["selected"] === "true");

      // Taishō, Shōwa, Heisei and Reiwa all reach a year 8, and each is its own cell.
      expect(selected.map((cell) => cell.textContent?.trim())).toEqual(["令和8年"]);
      calendar.unmount();
    });

    /*
     * A year number outside the Gregorian calendar counts from somewhere else, so holding it against
     * the Gregorian one asks whether 8 is 2026 and marks nothing at all. The dates answer it.
     */
    it("marks the year today falls in, counted the way the calendar counts", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

      const calendar = renderCalendar({
        createCalendar,
        defaultFocusedValue: new CalendarDate(2000, 6, 15),
        locale: "ja-JP-u-ca-japanese",
        withYearPicker: true,
      });
      const marked = (selector: string) =>
        calendar
          .years()
          .filter((cell) => cell.matches(selector) || cell.querySelector(selector) !== null)
          .map((cell) => cell.textContent?.trim());

      // Heisei 12 is focused, so the marked year is today's rather than the selected one.
      expect(marked("[data-body-current-year]")).toEqual(["令和8年"]);
      expect(marked("[data-cell-current-year]")).toEqual(["令和8年"]);
      calendar.unmount();
    });

    it("moves to the era the chosen cell shows, not the first year of that number", async () => {
      const calendar = renderCalendar({
        createCalendar,
        defaultYearPickerOpen: true,
        locale: "ja-JP-u-ca-japanese",
        withYearPicker: true,
      });

      calendar
        .years()
        .find((cell) => cell.textContent?.trim() === "平成8年")!
        .click();
      await nextTick();

      // Taishō 8 is the first year numbered 8 on offer, and is what a lookup by number would find.
      expect(calendar.slot("calendar-year-picker-trigger-heading").textContent).toContain(
        "平成8年",
      );
      calendar.unmount();
    });
  });
});
