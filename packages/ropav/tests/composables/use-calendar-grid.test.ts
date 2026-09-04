import type { UseCalendarGridReturn } from "@/composables/use-calendar-grid";
import type { CalendarState } from "@/composables/use-calendar-state";

import { CalendarDate } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import Host from "../fixtures/calendar-grid-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: { grid: UseCalendarGridReturn; state: CalendarState };

  Object.assign(props, {
    defaultFocusedValue: props["defaultFocusedValue"] ?? new CalendarDate(2026, 6, 15),
    locale: props["locale"] ?? "en-US",
    onReady: (value: { grid: UseCalendarGridReturn; state: CalendarState }) => (ready = value),
  });

  const result = renderVapor(Host, { props });
  const grid = result.container.querySelector<HTMLElement>("[data-slot='calendar-grid']")!;

  return {
    ...result,

    api: () => ready.grid,

    /** Where focus is, as an ISO date. */
    focused: () => String(ready.state.focusedDate.value),

    grid,
    press: (key: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
        ...init,
      });

      grid.dispatchEvent(event);

      return event;
    },
    range: () => `${ready.state.visibleRange.value.start}..${ready.state.visibleRange.value.end}`,
    state: () => ready.state,
  };
};

describe("useCalendarGrid", () => {
  describe("the grid element", () => {
    it("is a grid, so a screen reader reads it as rows and columns", () => {
      expect(setup().grid.getAttribute("role")).toBe("grid");
    });

    it("names the grid after the dates it shows", () => {
      expect(setup().grid.getAttribute("aria-label")).toBe("June 2026");
    });

    it("puts the calendar's own label in front of the range", () => {
      expect(setup({ ariaLabel: "Event date" }).grid.getAttribute("aria-label")).toBe(
        "Event date, June 2026",
      );
    });

    it("reports read-only and disabled only when they apply", () => {
      expect(setup().grid.getAttribute("aria-readonly")).toBeNull();
      expect(setup({ isReadOnly: true }).grid.getAttribute("aria-readonly")).toBe("true");
      expect(setup({ isDisabled: true }).grid.getAttribute("aria-disabled")).toBe("true");
    });

    it("reports multi-selectability only in multiple mode", () => {
      expect(setup().grid.getAttribute("aria-multiselectable")).toBeNull();
      expect(setup({ selectionMode: "multiple" }).grid.getAttribute("aria-multiselectable")).toBe(
        "true",
      );
    });

    it("hides the header row from screen readers", () => {
      // Each cell's own label already names its weekday, so announcing the column headers as well
      // would read the weekday twice per date.
      const calendar = setup();

      expect(
        calendar.container
          .querySelector("[data-slot='calendar-grid-header']")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
    });

    it("tracks whether focus is inside", () => {
      const calendar = setup();

      calendar.grid.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      expect(calendar.state().isFocused.value).toBe(true);

      calendar.grid.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      expect(calendar.state().isFocused.value).toBe(false);
    });
  });

  describe("the weekday names", () => {
    it("writes them short by default", () => {
      expect(setup().api().weekDays.value).toEqual([
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ]);
    });

    it("writes them at the requested width", () => {
      expect(setup({ weekdayStyle: "short" }).api().weekDays.value[0]).toBe("Sun");
      expect(setup({ weekdayStyle: "long" }).api().weekDays.value[0]).toBe("Sunday");
    });

    it("starts the week where the locale starts it", () => {
      expect(setup({ locale: "de-DE", weekdayStyle: "short" }).api().weekDays.value[0]).toBe("Mo");
    });

    it("follows an explicit first day of the week over the locale's", () => {
      expect(setup({ firstDayOfWeek: "wed", weekdayStyle: "short" }).api().weekDays.value[0]).toBe(
        "Wed",
      );
    });

    it("labels the actual days a day view shows rather than a generic week", () => {
      // A three-day view has three columns, and they are those three days.
      const calendar = setup({ visibleDuration: { days: 3 }, weekdayStyle: "short" });

      expect(calendar.api().weekDays.value).toEqual(["Sun", "Mon", "Tue"]);
    });
  });

  describe("how many rows it has", () => {
    it("covers the visible month", () => {
      expect(setup().api().weeksInMonth.value).toBe(5);
    });

    it("covers a week view in one row", () => {
      expect(setup({ visibleDuration: { weeks: 1 } }).api().weeksInMonth.value).toBe(1);
    });

    it("rounds a day view up to whole rows", () => {
      expect(setup({ visibleDuration: { days: 10 } }).api().weeksInMonth.value).toBe(2);
    });
  });

  describe("the keyboard", () => {
    it("steps a day with the arrow keys", () => {
      const calendar = setup();

      calendar.press("ArrowRight");
      expect(calendar.focused()).toBe("2026-06-16");
      calendar.press("ArrowLeft");
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("swaps left and right in a right-to-left locale", () => {
      // The arrows follow the writing direction, not the calendar's own order.
      const calendar = setup({ locale: "ar-AE" });

      calendar.press("ArrowLeft");
      expect(calendar.focused()).toBe("2026-06-16");
      calendar.press("ArrowRight");
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("steps a week with up and down", () => {
      const calendar = setup();

      calendar.press("ArrowDown");
      expect(calendar.focused()).toBe("2026-06-22");
      calendar.press("ArrowUp");
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("jumps to the ends of the section with Home and End", () => {
      const calendar = setup();

      calendar.press("End");
      expect(calendar.focused()).toBe("2026-06-30");
      calendar.press("Home");
      expect(calendar.focused()).toBe("2026-06-01");
    });

    it("pages a month with PageDown and PageUp", () => {
      const calendar = setup();

      calendar.press("PageDown");
      expect(calendar.focused()).toBe("2026-07-15");
      calendar.press("PageUp");
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("pages a year when Shift is held", () => {
      const calendar = setup();

      calendar.press("PageDown", { shiftKey: true });
      expect(calendar.focused()).toBe("2027-06-15");
      calendar.press("PageUp", { shiftKey: true });
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("selects the focused date with Enter and with Space", () => {
      const withEnter = setup();

      withEnter.press("Enter");
      expect(String(withEnter.state().value.value)).toBe("2026-06-15");

      const withSpace = setup();

      withSpace.press(" ");
      expect(String(withSpace.state().value.value)).toBe("2026-06-15");
    });

    it("keeps stepping while an arrow is held", () => {
      // Navigation has to survive auto-repeat, or holding an arrow would move exactly one day.
      const calendar = setup();

      calendar.press("ArrowRight", { repeat: true });
      expect(calendar.focused()).toBe("2026-06-16");
    });

    it("ignores a held Home or End, which act once per press", () => {
      const calendar = setup();

      calendar.press("End", { repeat: true });
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("leaves a key it handles to nothing else", () => {
      const calendar = setup();

      expect(calendar.press("ArrowRight").defaultPrevented).toBe(true);
      expect(calendar.press("End").defaultPrevented).toBe(true);
    });

    it("leaves Escape to whatever is above it", () => {
      // A calendar inside a popover must not swallow the key that closes the popover.
      expect(setup().press("Escape").defaultPrevented).toBe(false);
    });

    it("leaves Tab and modified keys alone", () => {
      const calendar = setup();

      expect(calendar.press("Tab").defaultPrevented).toBe(false);
      expect(calendar.press("ArrowRight", { altKey: true }).defaultPrevented).toBe(false);
      expect(calendar.focused()).toBe("2026-06-15");
    });

    it("moves the visible range when stepping off the page", () => {
      const calendar = setup({ defaultFocusedValue: new CalendarDate(2026, 6, 30) });

      calendar.press("ArrowRight");
      expect(calendar.range()).toBe("2026-07-01..2026-07-31");
    });

    it("refuses to move past a bound", () => {
      const calendar = setup({ maxValue: new CalendarDate(2026, 6, 15) });

      calendar.press("ArrowRight");
      expect(calendar.focused()).toBe("2026-06-15");
    });
  });
});
