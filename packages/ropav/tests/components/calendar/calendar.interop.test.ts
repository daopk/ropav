import type { CalendarDate as CalendarDateType } from "@internationalized/date";

import { CalendarDate } from "@internationalized/date";
import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  Calendar,
} from "@/components/calendar";
import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
} from "@/components/calendar-year-picker";

/**
 * The calendar mounted the way a consumer mounts it: from a VDOM host, with every part written in
 * the host and forwarded through the root's slots.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a VDOM
 * host resolves against the host. Everything the grid, the cells and the year picker need — the
 * state, the labelling, the grid's own month — arrives through `provide`, so the path every real
 * application uses has to be checked on its own.
 */
const render = (props: Record<string, unknown> = {}) => {
  const result = renderInterop(Calendar, {
    props: {
      "aria-label": "Event date",
      defaultFocusedValue: new CalendarDate(2026, 6, 15),
      ...props,
    },
    slots: {
      default: () => [
        h(CalendarHeader, null, {
          default: () => [
            h(CalendarNavButton, { slot: "previous" }),
            h(CalendarYearPickerTrigger, null, {
              default: () => h(CalendarYearPickerTriggerHeading),
            }),
            h(CalendarHeading),
            h(CalendarNavButton, { slot: "next" }),
          ],
        }),
        h(CalendarGrid, null, {
          default: () => [
            h(CalendarGridHeader, null, {
              default: ({ day }: { day: string }) =>
                h(CalendarHeaderCell, null, { default: () => day }),
            }),
            h(CalendarGridBody, null, {
              default: ({ date }: { date: CalendarDateType }) => h(CalendarCell, { date }),
            }),
          ],
        }),
        h(CalendarYearPickerGrid, null, {
          default: () =>
            h(CalendarYearPickerGridBody, null, {
              default: ({ year }: { year: number }) => h(CalendarYearPickerCell, { year }),
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

  return { ...result, all, slot };
};

describe("Calendar interop", () => {
  it("renders every part written in a VDOM host", () => {
    const calendar = render();

    for (const name of [
      "calendar",
      "calendar-header",
      "calendar-heading",
      "calendar-nav-button",
      "calendar-grid",
      "calendar-grid-header",
      "calendar-header-cell",
      "calendar-grid-body",
      "calendar-cell",
      "calendar-year-picker-trigger",
      "calendar-year-picker-trigger-heading",
      "calendar-year-picker-grid",
      "calendar-year-picker-year-cell",
    ]) {
      expect(calendar.slot(name), name).not.toBeNull();
    }

    calendar.unmount();
  });

  it("reaches the calendar's state from a cell in the host", () => {
    // The state arrives through `provide`, and a cell has no other way to know which date it is.
    const calendar = render({ value: new CalendarDate(2026, 6, 10) });
    const selected = calendar.all("calendar-cell").filter((cell) => cell.dataset["selected"]);

    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(["10"]);
    calendar.unmount();
  });

  it("reaches the grid's own month from a cell in the host", () => {
    // `isOutsideMonth` comes from the grid context, which is a second `provide` between the root
    // and the cell.
    const calendar = render();
    const [first] = calendar.all("calendar-cell");

    expect(first?.dataset["outsideMonth"]).toBe("true");
    calendar.unmount();
  });

  it("names the grid from the calendar's own labelling", () => {
    // The label travels root → `useCalendar` → provide → grid.
    const calendar = render();

    expect(calendar.slot("calendar-grid")?.getAttribute("aria-label")).toBe(
      "Event date, June 2026",
    );
    calendar.unmount();
  });

  it("pages from a nav button in the host", async () => {
    const calendar = render();

    calendar.slot("calendar-nav-button")!.click();
    await nextTick();

    expect(calendar.slot("calendar-heading")?.textContent).toBe("May 2026");
    calendar.unmount();
  });

  it("opens the year picker from a trigger in the host", async () => {
    // Whether the picker is open is a third `provide`, and the trigger and the grid are siblings —
    // neither can own it.
    const calendar = render();

    calendar.slot("calendar-year-picker-trigger")!.click();
    await nextTick();

    expect(calendar.slot("calendar-year-picker-grid")?.getAttribute("aria-hidden")).toBe("false");
    calendar.unmount();
  });

  it("reaches the year list from a cell in the host", () => {
    const calendar = render({
      maxValue: new CalendarDate(2028, 12, 31),
      minValue: new CalendarDate(2024, 1, 1),
    });

    expect(
      calendar.all("calendar-year-picker-year-cell").map((cell) => cell.dataset["year"]),
    ).toEqual(["2024", "2025", "2026", "2027", "2028"]);
    calendar.unmount();
  });
});
