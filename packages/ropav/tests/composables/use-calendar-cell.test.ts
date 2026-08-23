import type { UseCalendarCellReturn } from "@/composables/use-calendar-cell";
import type { CalendarState } from "@/composables/use-calendar-state";
import type { DateValue } from "@internationalized/date";

import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/calendar-cell-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: { cells: Map<string, UseCalendarCellReturn>; state: CalendarState };

  Object.assign(props, {
    defaultFocusedValue: props["defaultFocusedValue"] ?? new CalendarDate(2026, 6, 15),
    locale: props["locale"] ?? "en-US",
    onReady: (value: { cells: Map<string, UseCalendarCellReturn>; state: CalendarState }) =>
      (ready = value),
  });

  const result = renderVapor(Host, { props });

  return {
    ...result,

    /** The focusable element of one cell. */
    button: (iso: string) => result.container.querySelector<HTMLElement>(`[data-date='${iso}']`)!,

    /** The composable for one date, by ISO string. */
    cell: (iso: string) => ready.cells.get(iso)!,
    state: () => ready.state,
  };
};

const JUN = (day: number) => `2026-06-${String(day).padStart(2, "0")}`;

const press = (element: HTMLElement) => {
  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      height: 1,
      pointerId: 1,
      pointerType: "mouse",
      width: 1,
    }),
  );
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      height: 1,
      pointerId: 1,
      pointerType: "mouse",
      width: 1,
    }),
  );
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
};

describe("useCalendarCell", () => {
  describe("how the cell is announced", () => {
    it("is a button inside a grid cell", () => {
      // Not a `<button>`: the grid owns the arrow keys, and a native button in a gridcell would
      // fight the screen reader's own table navigation.
      const calendar = setup();

      expect(calendar.button(JUN(15)).getAttribute("role")).toBe("button");
      expect(calendar.button(JUN(15)).closest("td")?.getAttribute("role")).toBe("gridcell");
    });

    it("names the cell with the whole date, not the day number", () => {
      // "15" out of context tells a screen reader user nothing about which month they are in.
      expect(setup().button(JUN(15)).getAttribute("aria-label")).toBe("Monday, June 15, 2026");
    });

    it("says so when the date is selected", () => {
      expect(
        setup({ value: new CalendarDate(2026, 6, 10) })
          .button(JUN(10))
          .getAttribute("aria-label"),
      ).toBe("Wednesday, June 10, 2026 selected");
    });

    it("says so when the date is today", () => {
      const now = today(getLocalTimeZone());
      const calendar = setup({ defaultFocusedValue: now });

      expect(calendar.button(String(now)).getAttribute("aria-label")).toContain("Today");
    });

    it("names the bounds, so a user knows why the arrows stopped", () => {
      const calendar = setup({
        maxValue: new CalendarDate(2026, 6, 20),
        minValue: new CalendarDate(2026, 6, 2),
      });

      expect(calendar.button(JUN(2)).getAttribute("aria-label")).toBe(
        "Tuesday, June 2, 2026, First available date",
      );
      expect(calendar.button(JUN(20)).getAttribute("aria-label")).toBe(
        "Saturday, June 20, 2026, Last available date",
      );
    });

    it("follows the locale", () => {
      expect(setup({ locale: "de-DE" }).button(JUN(15)).getAttribute("aria-label")).toBe(
        "Montag, 15. Juni 2026",
      );
    });

    it("writes the day number in the calendar system on screen", () => {
      const calendar = setup({ locale: "th-TH-u-ca-buddhist" });
      const [button] = [...calendar.container.querySelectorAll("[data-date]")];

      expect(button?.textContent?.trim()).toBeTruthy();
    });
  });

  describe("which cell is reachable by Tab", () => {
    it("gives the focused date the only tab stop", () => {
      const calendar = setup();

      expect(calendar.button(JUN(15)).getAttribute("tabindex")).toBe("0");
      expect(calendar.button(JUN(16)).getAttribute("tabindex")).toBe("-1");
    });

    it("takes a disabled cell out of the tab order entirely", () => {
      // Not `-1`: a disabled date is not a stop the arrow keys should be able to reach either.
      const calendar = setup({ maxValue: new CalendarDate(2026, 6, 15) });

      expect(calendar.button(JUN(16)).getAttribute("tabindex")).toBeNull();
    });
  });

  describe("what each state reports", () => {
    it("marks the selected date", () => {
      const calendar = setup({ value: new CalendarDate(2026, 6, 10) });

      expect(calendar.cell(JUN(10)).isSelected.value).toBe(true);
      expect(calendar.button(JUN(10)).closest("td")?.getAttribute("aria-selected")).toBe("true");
    });

    it("disables a date outside the bounds", () => {
      const calendar = setup({ minValue: new CalendarDate(2026, 6, 10) });

      expect(calendar.cell(JUN(9)).isDisabled.value).toBe(true);
      expect(calendar.button(JUN(9)).getAttribute("aria-disabled")).toBe("true");
    });

    it("disables a date from a neighbouring month", () => {
      // June 2026 starts on a Monday, so 31 May fills the first cell of the grid.
      const calendar = setup();

      expect(calendar.cell("2026-05-31").isDisabled.value).toBe(true);
      expect(calendar.cell("2026-05-31").isOutsideVisibleRange.value).toBe(true);
    });

    it("marks an unavailable date without disabling it", () => {
      // Unavailable dates stay focusable so a user can find out they are unavailable.
      const calendar = setup({ isDateUnavailable: (date: DateValue) => date.day === 16 });

      expect(calendar.cell(JUN(16)).isUnavailable.value).toBe(true);
      expect(calendar.cell(JUN(16)).isDisabled.value).toBe(false);
      expect(calendar.button(JUN(16)).getAttribute("aria-disabled")).toBe("true");
    });

    it("marks today", () => {
      const now = today(getLocalTimeZone());

      expect(setup({ defaultFocusedValue: now }).cell(String(now)).isToday.value).toBe(true);
    });

    it("shows an invalid selection as selected, so the offending cell is the marked one", () => {
      const calendar = setup({
        isDateUnavailable: (date: DateValue) => date.day === 10,
        value: new CalendarDate(2026, 6, 10),
      });

      expect(calendar.cell(JUN(10)).isInvalid.value).toBe(true);
      expect(calendar.cell(JUN(10)).isSelected.value).toBe(true);
      expect(calendar.button(JUN(10)).getAttribute("aria-invalid")).toBe("true");
    });

    it("marks every date of an invalid multiple selection", () => {
      const calendar = setup({
        isInvalid: true,
        selectionMode: "multiple",
        value: [new CalendarDate(2026, 6, 10), new CalendarDate(2026, 6, 20)],
      });

      expect(calendar.cell(JUN(10)).isInvalid.value).toBe(true);
      expect(calendar.cell(JUN(20)).isInvalid.value).toBe(true);
      expect(calendar.cell(JUN(11)).isInvalid.value).toBe(false);
    });

    it("only reports a focused cell once focus is inside the calendar", () => {
      expect(setup().cell(JUN(15)).isFocused.value).toBe(false);
      expect(setup({ autoFocus: true }).cell(JUN(15)).isFocused.value).toBe(true);
    });

    it("never reports a cell outside the month as focused", async () => {
      /*
       * A two-month view puts 1 July in both grids: in July's own, and as a trailing cell of
       * June's. Only the one whose month it is may hold focus, or the same date would light up
       * twice.
       */
      const calendar = setup({ autoFocus: true, visibleDuration: { months: 2 } });

      calendar.state().setFocusedDate(new CalendarDate(2026, 7, 1));
      await nextTick();

      expect(calendar.state().isCellFocused(new CalendarDate(2026, 7, 1))).toBe(true);
      expect(calendar.cell("2026-07-01").isFocused.value).toBe(false);
      expect(calendar.cell("2026-07-01").isDisabled.value).toBe(true);
    });
  });

  describe("selecting with a pointer", () => {
    it("selects the date and takes focus", () => {
      const calendar = setup();

      press(calendar.button(JUN(20)));

      expect(String(calendar.state().value.value)).toBe("2026-06-20");
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-20");
      expect(calendar.state().isFocused.value).toBe(true);
    });

    it("does nothing on a disabled cell", () => {
      const calendar = setup({ minValue: new CalendarDate(2026, 6, 10) });

      press(calendar.button(JUN(9)));

      expect(calendar.state().value.value).toBeNull();
    });

    it("does nothing on an unavailable cell", () => {
      const calendar = setup({ isDateUnavailable: (date: DateValue) => date.day === 16 });

      press(calendar.button(JUN(16)));

      expect(calendar.state().value.value).toBeNull();
    });

    it("moves focus but selects nothing while read only", () => {
      const calendar = setup({ isReadOnly: true });

      press(calendar.button(JUN(20)));

      expect(calendar.state().value.value).toBeNull();
    });

    it("swallows the context menu, so a long press can drag instead", () => {
      const calendar = setup();
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });

      calendar.button(JUN(15)).dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("moving real focus", () => {
    it("focuses the element of whichever date the state focuses", async () => {
      const calendar = setup({ autoFocus: true });

      await nextTick();
      expect(document.activeElement).toBe(calendar.button(JUN(15)));

      calendar.state().focusNextDay();
      await nextTick();

      expect(document.activeElement).toBe(calendar.button(JUN(16)));
    });

    it("adopts focus that arrives from outside", () => {
      const calendar = setup();

      calendar.button(JUN(20)).dispatchEvent(new FocusEvent("focus", { bubbles: false }));

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-20");
      expect(calendar.state().isFocused.value).toBe(true);
    });

    it("ignores focus arriving on a disabled cell", () => {
      const calendar = setup({ minValue: new CalendarDate(2026, 6, 10) });

      calendar.button(JUN(9)).dispatchEvent(new FocusEvent("focus", { bubbles: false }));

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-15");
    });
  });
});
