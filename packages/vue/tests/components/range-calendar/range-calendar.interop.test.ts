import type {CalendarDate as CalendarDateType} from "@internationalized/date";

import {renderInterop} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
} from "@/components/calendar-year-picker";
import {
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendarRoot,
} from "@/components/range-calendar";

/**
 * The range calendar mounted the way a consumer mounts it: from a VDOM host, with every part written
 * in the host and forwarded through the root's slots.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a VDOM
 * host resolves against the host. Everything the grid, the cells and the year picker need arrives
 * through `provide`, so the path every real application uses has to be checked on its own.
 */
const render = (props: Record<string, unknown> = {}) => {
  const result = renderInterop(RangeCalendarRoot, {
    props: {
      "aria-label": "Stay",
      defaultFocusedValue: new CalendarDate(2026, 6, 15),
      ...props,
    },
    slots: {
      default: () => [
        h(RangeCalendarHeader, null, {
          default: () => [
            h(RangeCalendarNavButton, {slot: "previous"}),
            h(CalendarYearPickerTrigger, null, {
              default: () => h(CalendarYearPickerTriggerHeading),
            }),
            h(RangeCalendarHeading),
            h(RangeCalendarNavButton, {slot: "next"}),
          ],
        }),
        h(RangeCalendarGrid, null, {
          default: () => [
            h(RangeCalendarGridHeader, null, {
              default: ({day}: {day: string}) =>
                h(RangeCalendarHeaderCell, null, {default: () => day}),
            }),
            h(RangeCalendarGridBody, null, {
              default: ({date}: {date: CalendarDateType}) => h(RangeCalendarCell, {date}),
            }),
          ],
        }),
        h(CalendarYearPickerGrid, null, {
          default: () =>
            h(CalendarYearPickerGridBody, null, {
              default: ({year}: {year: number}) => h(CalendarYearPickerCell, {year}),
            }),
        }),
      ],
    },
  });

  // Scoped to this mount rather than to the document: a failed assertion skips `unmount`, and a
  // document-wide query would then read the leftovers of an earlier test.
  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`);
  const all = (name: string) => [
    ...result.container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
  ];

  return {...result, all, slot};
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

describe("RangeCalendar interop", () => {
  it("renders every part written in a VDOM host", () => {
    const calendar = render();

    for (const name of [
      "range-calendar",
      "range-calendar-header",
      "range-calendar-heading",
      "range-calendar-nav-button",
      "range-calendar-grid",
      "range-calendar-grid-header",
      "range-calendar-header-cell",
      "range-calendar-grid-body",
      "range-calendar-cell",
      "range-calendar-cell-button",
      "calendar-year-picker-trigger",
      "calendar-year-picker-grid",
      "calendar-year-picker-year-cell",
    ]) {
      expect(calendar.slot(name), name).not.toBeNull();
    }

    calendar.unmount();
  });

  it("reaches the calendar's state from a cell in the host", () => {
    const calendar = render({value: {end: jun(12), start: jun(10)}});
    const selected = calendar.all("range-calendar-cell").filter((cell) => cell.dataset["selected"]);

    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(["10", "11", "12"]);
    calendar.unmount();
  });

  it("tells the two ends apart from a cell in the host", () => {
    // Which end a cell is comes from the highlighted range on the state context.
    const calendar = render({value: {end: jun(12), start: jun(10)}});

    expect(
      calendar
        .all("range-calendar-cell")
        .filter((cell) => cell.dataset["selectionStart"])
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["10"]);
    expect(
      calendar
        .all("range-calendar-cell")
        .filter((cell) => cell.dataset["selectionEnd"])
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["12"]);
    calendar.unmount();
  });

  it("reaches the grid's own month from a cell in the host", () => {
    const calendar = render();
    const [first] = calendar.all("range-calendar-cell");

    expect(first?.dataset["outsideMonth"]).toBe("true");
    calendar.unmount();
  });

  it("names the grid from the calendar's own labelling", () => {
    const calendar = render();

    expect(calendar.slot("range-calendar-grid")?.getAttribute("aria-label")).toBe(
      "Stay, June 2026",
    );
    calendar.unmount();
  });

  it("pages from a nav button in the host", async () => {
    const calendar = render();

    calendar.slot("range-calendar-nav-button")!.click();
    await nextTick();

    expect(calendar.slot("range-calendar-heading")?.textContent).toBe("May 2026");
    calendar.unmount();
  });

  it("builds a range from cells in the host", async () => {
    const calendar = render();
    const cell = (day: number) =>
      calendar.all("range-calendar-cell").find((c) => c.textContent?.trim() === String(day))!;

    cell(10).click();
    await nextTick();
    cell(12).click();
    await nextTick();

    expect(
      calendar
        .all("range-calendar-cell")
        .filter((c) => c.dataset["selected"])
        .map((c) => c.textContent?.trim()),
    ).toEqual(["10", "11", "12"]);
    calendar.unmount();
  });

  it("opens the year picker from a trigger in the host", async () => {
    const calendar = render();

    calendar.slot("calendar-year-picker-trigger")!.click();
    await nextTick();

    expect(calendar.slot("calendar-year-picker-grid")?.getAttribute("aria-hidden")).toBe("false");
    calendar.unmount();
  });
});
