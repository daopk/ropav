import type {DateSegment} from "@/composables/use-date-field-state";
import type {CalendarDate as CalendarDateType} from "@internationalized/date";

import {renderInterop} from "@heroui/testing/helpers/vue";
import {CalendarDate} from "@internationalized/date";
import {describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarRoot,
} from "@/components/calendar";
import {
  DatePickerGroup,
  DatePickerInput,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerSegment,
  DatePickerSuffix,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
} from "@/components/date-picker";
import {Label} from "@/components/label";

/**
 * The picker mounted the way a consumer mounts it: from a VDOM host, with every part written in the
 * host and forwarded through the root's slots.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a VDOM
 * host resolves against the host. The field, the group's wiring, the trigger and the calendar all
 * arrive through `provide`, so the path every real application uses has to be checked on its own.
 */
const render = (props: Record<string, unknown> = {}) => {
  const result = renderInterop(DatePickerRoot, {
    props: {defaultOpen: true, ...props},
    slots: {
      default: () => [
        h(Label, null, {default: () => "Appointment"}),
        h(DatePickerGroup, null, {
          default: () => [
            h(DatePickerInput, null, {
              default: ({segment}: {segment: DateSegment}) => h(DatePickerSegment, {segment}),
            }),
            h(DatePickerSuffix, null, {
              default: () =>
                h(DatePickerTrigger, null, {default: () => h(DatePickerTriggerIndicator)}),
            }),
          ],
        }),
        h(DatePickerPopover, null, {
          default: () =>
            h(
              CalendarRoot,
              {"aria-label": "Selected date"},
              {
                default: () =>
                  h(CalendarGrid, null, {
                    default: () => [
                      h(CalendarGridHeader, null, {
                        default: ({day}: {day: string}) =>
                          h(CalendarHeaderCell, null, {default: () => day}),
                      }),
                      h(CalendarGridBody, null, {
                        default: ({date}: {date: CalendarDateType}) => h(CalendarCell, {date}),
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
      `[data-slot='date-picker-popover'] [data-slot='${name}']`,
    ),
  ];

  return {...result, all, inPopover, slot};
};

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

describe("DatePicker interop", () => {
  it("renders every part written in a VDOM host", () => {
    const picker = render();

    for (const name of [
      "date-picker",
      "date-input-group",
      "date-input-group-input",
      "date-input-group-segment",
      "date-input-group-suffix",
      "date-picker-trigger",
      "date-picker-trigger-indicator",
    ]) {
      expect(picker.slot(name), name).not.toBeNull();
    }

    picker.unmount();
  });

  it("reaches the picker's field from an input in the host", () => {
    const picker = render({value: jun(10)});
    const day = picker
      .all("date-input-group-segment")
      .find((element) => element.dataset["type"] === "day");

    expect(day?.textContent?.trim()).toBe("10");
    picker.unmount();
  });

  it("reaches the picker's group wiring from a group in the host", () => {
    const picker = render({id: "appointment"});
    const group = picker.slot("date-input-group")!;

    expect(group.getAttribute("id")).toBe("appointment");
    expect(group.getAttribute("aria-labelledby")).toBe(picker.slot("label")!.id);
    picker.unmount();
  });

  it("reaches the picker's open state from a trigger in the host", () => {
    const picker = render();

    expect(picker.slot("date-picker-trigger")?.getAttribute("aria-expanded")).toBe("true");
    picker.unmount();
  });

  it("drives a calendar written in the host from the picker's value", async () => {
    const picker = render({value: jun(10)});

    await settle();

    const selected = picker
      .inPopover("calendar-cell")
      .find((cell) => cell.dataset["selected"] === "true");

    expect(selected?.textContent?.trim()).toBe("10");
    picker.unmount();
  });
});
