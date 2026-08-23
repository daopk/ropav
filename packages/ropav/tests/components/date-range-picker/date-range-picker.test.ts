import { CalendarDate, CalendarDateTime } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

/** The popover is teleported a flush after it decides to render, and settles a flush after that. */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const renderPicker = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props: { locale: "en-US", ...props } });

  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;
  const all = (name: string) => [
    ...result.container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
  ];

  /** The two rows of segments, in DOM order: start first, then end. */
  const rows = () => all("date-input-group-input");

  return {
    ...result,
    all,
    group: () => slot("date-input-group"),
    root: () => slot("date-range-picker"),
    rows,

    /** One segment of one end, by the part of the date it edits. */
    segment: (part: "start" | "end", type: string) =>
      [
        ...rows()[part === "start" ? 0 : 1]!.querySelectorAll<HTMLElement>(
          "[data-slot='date-input-group-segment']",
        ),
      ].find((element) => element.getAttribute("data-type") === type)!,
    slot,
    trigger: () => slot("date-range-picker-trigger"),
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** Every open picker popover in the document, which is where a teleported overlay lands. */
const popovers = () => [
  ...document.body.querySelectorAll<HTMLElement>("[data-slot='date-range-picker-popover']"),
];

/**
 * Something inside an open popover, looked for in the document rather than in the container.
 *
 * Scoped by the popover itself so a leftover from a test that threw before unmounting cannot be
 * mistaken for this one's.
 */
const inPopover = (name: string) =>
  popovers().flatMap((element) => [
    ...element.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
  ]);

describe("DateRangePicker", () => {
  describe("structure", () => {
    it("renders two rows of segments with a separator between them", () => {
      const picker = renderPicker({ value: { end: jun(20), start: jun(10) } });

      expect(picker.rows()).toHaveLength(2);
      expect(picker.slot("date-range-picker-range-separator")).toBeTruthy();
      expect(picker.trigger().tagName).toBe("BUTTON");
      picker.unmount();
    });

    it("hides the separator from assistive technology", () => {
      // The two ends already name themselves, so a dash read between them is a word in the way.
      const picker = renderPicker();
      const separator = picker.slot("date-range-picker-range-separator");

      expect(separator.getAttribute("aria-hidden")).toBe("true");
      expect(separator.textContent).toBe(" - ");
      picker.unmount();
    });

    it("takes content for the separator instead", () => {
      const picker = renderPicker({ customSeparator: true });

      expect(picker.slot("custom-separator").textContent).toBe("to");
      picker.unmount();
    });

    it("renders no popover until the trigger is pressed", async () => {
      const picker = renderPicker();

      expect(popovers()).toHaveLength(0);

      press(picker.trigger());
      await settle();

      expect(popovers()).toHaveLength(1);
      picker.unmount();
    });

    it("submits each end under its own name", () => {
      const picker = renderPicker({
        endName: "checkOut",
        startName: "checkIn",
        value: { end: jun(20), start: jun(10) },
      });

      expect(picker.container.querySelector<HTMLInputElement>("input[name='checkIn']")?.value).toBe(
        "2026-06-10",
      );
      expect(
        picker.container.querySelector<HTMLInputElement>("input[name='checkOut']")?.value,
      ).toBe("2026-06-20");
      picker.unmount();
    });

    it("reads a bare boolean attribute as set", () => {
      /*
       * The form a caller actually writes. An imported indexed-access prop type compiles to a prop
       * with no runtime type, and Vue then hands `<DateRangePicker is-disabled>` the empty string.
       */
      const picker = renderPicker({ attributeForm: true });

      expect(picker.root().getAttribute("data-disabled")).toBe("true");
      expect(picker.root().getAttribute("data-required")).toBe("true");
      picker.unmount();
    });

    it("refuses an input that does not say which end it edits", () => {
      /*
       * A range picker owns two fields and renders neither, so the markup has to say which one a
       * row of segments belongs to. Guessing would silently edit the wrong end.
       */
      expect(() => renderPicker({ missingSlot: true })).toThrow(/slot="start"/);
    });
  });

  describe("the group it owns", () => {
    it("carries the picker's own name and role rather than either field's", () => {
      const picker = renderPicker({ label: "Trip dates" });

      expect(picker.group().getAttribute("role")).toBe("group");
      expect(picker.group().getAttribute("aria-labelledby")).toBe(picker.slot("label").id);
      // Both fields step aside, so a screen reader does not announce three nested groups.
      for (const row of picker.rows()) expect(row.getAttribute("role")).toBe("presentation");
      picker.unmount();
    });

    it("describes the whole range in words", () => {
      const picker = renderPicker({ value: { end: jun(20), start: jun(10) } });
      const describedBy = picker.group().getAttribute("aria-describedby");

      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)?.textContent).toContain("June");
      picker.unmount();
    });

    it("reports the picker disabled without being told", () => {
      const picker = renderPicker({ isDisabled: true });

      expect(picker.group().getAttribute("aria-disabled")).toBe("true");
      expect(picker.group().getAttribute("data-disabled")).toBe("true");
      picker.unmount();
    });

    it("shows the picker's verdict about the range", async () => {
      const picker = renderPicker({ isInvalid: true });

      await settle();

      expect(picker.group().getAttribute("data-invalid")).toBe("true");
      expect(picker.root().getAttribute("data-invalid")).toBe("true");
      picker.unmount();
    });

    it("opens the popover on Alt with an arrow from either end", async () => {
      const picker = renderPicker();

      picker.segment("end", "month").dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          cancelable: true,
          key: "ArrowDown",
        }),
      );
      await settle();

      expect(popovers()).toHaveLength(1);
      picker.unmount();
    });
  });

  describe("the two ends", () => {
    it("shows the range the picker holds, one end per row", () => {
      const picker = renderPicker({ value: { end: jun(20), start: jun(10) } });

      expect(picker.segment("start", "day").textContent?.trim()).toBe("10");
      expect(picker.segment("end", "day").textContent?.trim()).toBe("20");
      picker.unmount();
    });

    it("names each end, so a bare number says which one it belongs to", () => {
      const picker = renderPicker({ label: "Trip dates" });

      expect(picker.segment("start", "month").getAttribute("aria-label")).toBe(
        "month, Start Date, ",
      );
      expect(picker.segment("end", "month").getAttribute("aria-label")).toBe("month, End Date, ");
      picker.unmount();
    });

    it("edits only its own end", async () => {
      const onValueChange = vi.fn();
      const picker = renderPicker({
        defaultValue: { end: jun(20), start: jun(10) },
        onValueChange,
      });

      picker.segment("end", "day").dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: "5",
          inputType: "insertText",
        }),
      );
      await nextTick();

      const next = onValueChange.mock.calls.at(-1)?.[0];

      expect(String(next?.start)).toBe("2026-06-10");
      expect(String(next?.end)).toBe("2026-06-05");
      picker.unmount();
    });

    it("takes its shape from the granularity the picker was given", () => {
      const picker = renderPicker({
        granularity: "minute",
        value: {
          end: new CalendarDateTime(2026, 6, 20, 17, 30),
          start: new CalendarDateTime(2026, 6, 10, 9, 0),
        },
      });

      expect(picker.segment("start", "hour")).toBeTruthy();
      expect(picker.segment("end", "minute")).toBeTruthy();
      picker.unmount();
    });

    it("never reaches a verdict of its own about the range", async () => {
      // The picker holds the bounds, so an end judging them too could disagree with it.
      const picker = renderPicker({ minValue: jun(12), value: { end: jun(20), start: jun(10) } });

      await settle();

      for (const row of picker.rows()) expect(row.getAttribute("data-invalid")).toBeNull();
      picker.unmount();
    });
  });

  describe("moving along the row of segments", () => {
    it("crosses from one end to the other, stepping over the trigger", async () => {
      /*
       * The row spans both fields with the button between them in the DOM, which is why the focus
       * manager belongs to the picker and excludes the button.
       */
      const picker = renderPicker({ value: { end: jun(20), start: jun(10) } });
      const last = picker.segment("start", "year");

      last.focus();
      last.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
      );
      await nextTick();

      expect(document.activeElement).toBe(picker.segment("end", "month"));
      picker.unmount();
    });
  });

  describe("the popover", () => {
    it("drives the range calendar inside it from the picker's own value", async () => {
      const picker = renderPicker({ defaultOpen: true, value: { end: jun(12), start: jun(10) } });

      await settle();

      const selected = inPopover("range-calendar-cell")
        .filter((cell) => cell.dataset["selected"] === "true")
        .map((cell) => cell.textContent?.trim());

      expect(selected).toEqual(["10", "11", "12"]);
      picker.unmount();
    });

    it("lets the calendar's own markup win over what the picker says", async () => {
      // The story labels the calendar itself while leaving everything else to the picker.
      const picker = renderPicker({ defaultOpen: true });

      await settle();

      expect(inPopover("range-calendar")[0]!.getAttribute("aria-label")).toContain(
        "Selected range",
      );
      picker.unmount();
    });

    it("passes the picker's bounds on, so an out-of-range day cannot be picked", async () => {
      const picker = renderPicker({
        defaultOpen: true,
        minValue: jun(10),
        value: { end: jun(20), start: jun(15) },
      });

      await settle();

      const cell = inPopover("range-calendar-cell").find(
        (element) => element.textContent?.trim() === "5",
      )!;

      expect(cell.getAttribute("data-disabled")).toBe("true");
      picker.unmount();
    });

    it("takes a range built in the calendar, and closes", async () => {
      const onValueChange = vi.fn();
      // A placeholder so the calendar opens on a known month rather than on whatever today is in.
      const picker = renderPicker({ defaultOpen: true, onValueChange, placeholderValue: jun(15) });

      await settle();

      const cell = (day: number) =>
        inPopover("range-calendar-cell").find(
          (element) => element.textContent?.trim() === String(day),
        )!;

      press(cell(10));
      await nextTick();
      press(cell(14));
      await settle();

      const next = onValueChange.mock.calls.at(-1)?.[0];

      expect(String(next?.start)).toBe("2026-06-10");
      expect(String(next?.end)).toBe("2026-06-14");
      expect(popovers()).toHaveLength(0);
      picker.unmount();
    });

    it("stays open when the caller says picking a range should not close it", async () => {
      const picker = renderPicker({
        defaultOpen: true,
        placeholderValue: jun(15),
        shouldCloseOnSelect: false,
      });

      await settle();

      const cell = (day: number) =>
        inPopover("range-calendar-cell").find(
          (element) => element.textContent?.trim() === String(day),
        )!;

      press(cell(10));
      await nextTick();
      press(cell(14));
      await settle();

      expect(popovers()).toHaveLength(1);
      picker.unmount();
    });
  });

  describe("the trigger", () => {
    it("names itself and what it opens", () => {
      const picker = renderPicker({ label: "Trip dates" });
      const trigger = picker.trigger();

      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("aria-label")).toBe("Calendar");
      expect(trigger.getAttribute("aria-labelledby")).toBe(
        `${trigger.id} ${picker.slot("label").id}`,
      );
      picker.unmount();
    });

    it("reads as expanded while the popover is open", () => {
      const picker = renderPicker({ defaultOpen: true });

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("true");
      // Held pressed for as long as it is, so it looks like what the popover belongs to.
      expect(picker.trigger().getAttribute("data-pressed")).toBe("true");
      picker.unmount();
    });

    it("goes out of action when there is nothing to pick", () => {
      const readOnly = renderPicker({ isReadOnly: true });

      expect(readOnly.trigger().hasAttribute("disabled")).toBe(true);
      readOnly.unmount();

      const disabled = renderPicker({ isDisabled: true });

      expect(disabled.trigger().hasAttribute("disabled")).toBe(true);
      disabled.unmount();
    });

    it("takes content of its own instead of the default indicator", () => {
      const picker = renderPicker({ customIndicator: true });

      expect(picker.slot("custom-indicator").textContent).toBe("pick");
      picker.unmount();
    });
  });

  describe("focus", () => {
    it("reports focus entering and leaving the picker as a whole", async () => {
      const onFocusChange = vi.fn();
      const picker = renderPicker({ onFocusChange });

      picker.segment("start", "month").focus();
      await nextTick();

      expect(onFocusChange).toHaveBeenCalledWith(true);

      // Crossing from one end to the other never left the picker.
      onFocusChange.mockClear();
      picker.segment("end", "month").focus();
      await nextTick();

      expect(onFocusChange).not.toHaveBeenCalled();
      picker.unmount();
    });
  });

  describe("validation", () => {
    it("reveals a bounds failure through the error message slot", async () => {
      const picker = renderPicker({
        errorMessage: "Start on or after today",
        minValue: jun(12),
        value: { end: jun(20), start: jun(10) },
      });

      await settle();

      const message = picker.slot("error-message");

      expect(message).toBeTruthy();
      expect(picker.group().getAttribute("aria-describedby")).toContain(message.id);
      picker.unmount();
    });

    it("reports a range that runs backwards", async () => {
      // Read at once rather than held back until a commit, which is what `aria` behaviour means.
      const picker = renderPicker({
        validationBehavior: "aria",
        value: { end: jun(10), start: jun(20) },
      });

      await settle();

      expect(picker.root().getAttribute("data-invalid")).toBe("true");
      picker.unmount();
    });
  });
});
