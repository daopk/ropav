import type { DateSegment } from "@/composables/use-date-field-state";
import type { CalendarDate as CalendarDateType } from "@internationalized/date";

import { CalendarDate } from "@internationalized/date";
import { renderInterop } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import {
  DateRangePickerGroup,
  DateRangePickerInput,
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePicker,
  DateRangePickerSegment,
  DateRangePickerSuffix,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
} from "@/components/date-range-picker";
import { Label } from "@/components/label";
import {
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeaderCell,
  RangeCalendar,
} from "@/components/range-calendar";

/**
 * The picker mounted the way a consumer mounts it: from a VDOM host, with every part written in the
 * host and forwarded through the root's slots.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a VDOM
 * host resolves against the host. Which end an input edits is resolved from a context at setup, so
 * the path every real application uses has to be checked on its own.
 */
const render = (props: Record<string, unknown> = {}) => {
  const row = (slot: "start" | "end") =>
    h(
      DateRangePickerInput,
      { slot },
      {
        default: ({ segment }: { segment: DateSegment }) => h(DateRangePickerSegment, { segment }),
      },
    );

  const result = renderInterop(DateRangePicker, {
    props: { defaultOpen: true, ...props },
    slots: {
      default: () => [
        h(Label, null, { default: () => "Trip dates" }),
        h(DateRangePickerGroup, null, {
          default: () => [
            row("start"),
            h(DateRangePickerRangeSeparator),
            row("end"),
            h(DateRangePickerSuffix, null, {
              default: () =>
                h(DateRangePickerTrigger, null, {
                  default: () => h(DateRangePickerTriggerIndicator),
                }),
            }),
          ],
        }),
        h(DateRangePickerPopover, null, {
          default: () =>
            h(
              RangeCalendar,
              { "aria-label": "Selected range" },
              {
                default: () =>
                  h(RangeCalendarGrid, null, {
                    default: () => [
                      h(RangeCalendarGridHeader, null, {
                        default: ({ day }: { day: string }) =>
                          h(RangeCalendarHeaderCell, null, { default: () => day }),
                      }),
                      h(RangeCalendarGridBody, null, {
                        default: ({ date }: { date: CalendarDateType }) =>
                          h(RangeCalendarCell, { date }),
                      }),
                    ],
                  }),
              },
            ),
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

  /** The popover is teleported out of the container, so it is looked for in the document. */
  const inPopover = (name: string) => [
    ...document.body.querySelectorAll<HTMLElement>(
      `[data-slot='date-range-picker-popover'] [data-slot='${name}']`,
    ),
  ];

  const rows = () => all("date-input-group-input");

  return { ...result, all, inPopover, rows, slot };
};

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

describe("DateRangePicker interop", () => {
  it("renders every part written in a VDOM host", () => {
    const picker = render();

    for (const name of [
      "date-range-picker",
      "date-input-group",
      "date-input-group-input",
      "date-input-group-segment",
      "date-range-picker-range-separator",
      "date-input-group-suffix",
      "date-range-picker-trigger",
      "date-range-picker-trigger-indicator",
    ]) {
      expect(picker.slot(name), name).not.toBeNull();
    }

    picker.unmount();
  });

  it("resolves each row of segments to the end its markup names", () => {
    const picker = render({ value: { end: jun(20), start: jun(10) } });
    const day = (index: number) =>
      [...picker.rows()[index]!.querySelectorAll<HTMLElement>("[data-type='day']")][0]?.textContent;

    expect(day(0)?.trim()).toBe("10");
    expect(day(1)?.trim()).toBe("20");
    picker.unmount();
  });

  it("reaches the picker's group wiring from a group in the host", () => {
    const picker = render({ id: "trip" });
    const group = picker.slot("date-input-group")!;

    expect(group.getAttribute("id")).toBe("trip");
    expect(group.getAttribute("aria-labelledby")).toBe(picker.slot("label")!.id);
    picker.unmount();
  });

  it("reaches the picker's open state from a trigger in the host", () => {
    const picker = render();

    expect(picker.slot("date-range-picker-trigger")?.getAttribute("aria-expanded")).toBe("true");
    picker.unmount();
  });

  it("drives a range calendar written in the host from the picker's value", async () => {
    const picker = render({ value: { end: jun(12), start: jun(10) } });

    await settle();

    const selected = picker
      .inPopover("range-calendar-cell")
      .filter((cell) => cell.dataset["selected"] === "true")
      .map((cell) => cell.textContent?.trim());

    expect(selected).toEqual(["10", "11", "12"]);
    picker.unmount();
  });
});
