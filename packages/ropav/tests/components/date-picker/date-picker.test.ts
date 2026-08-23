import {CalendarDate, CalendarDateTime} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

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
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

/** The popover is teleported a flush after it decides to render, and settles a flush after that. */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const renderPicker = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props: {locale: "en-US", ...props}});

  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;
  const all = (name: string) => [
    ...result.container.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
  ];

  return {
    ...result,
    all,
    group: () => slot("date-input-group"),
    input: () => slot("date-input-group-input"),
    root: () => slot("date-picker"),

    /** One segment by the part of the date it edits. */
    segment: (type: string) =>
      all("date-input-group-segment").find(
        (element) => element.getAttribute("data-type") === type,
      )!,
    segments: () => all("date-input-group-segment"),
    slot,
    trigger: () => slot("date-picker-trigger"),
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** Every open picker popover in the document, which is where a teleported overlay lands. */
const popovers = () => [
  ...document.body.querySelectorAll<HTMLElement>("[data-slot='date-picker-popover']"),
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

describe("DatePicker", () => {
  describe("structure", () => {
    it("renders the group, the segments and the trigger", () => {
      const picker = renderPicker({value: jun(10)});

      expect(picker.root()).toBeTruthy();
      expect(picker.group().getAttribute("role")).toBe("group");
      expect(picker.segments().length).toBeGreaterThan(0);
      expect(picker.trigger().tagName).toBe("BUTTON");
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

    it("gives the trigger a calendar for its content, and takes one instead", () => {
      const plain = renderPicker();

      expect(plain.slot("date-picker-trigger-indicator")).toBeTruthy();
      plain.unmount();

      const custom = renderPicker({customIndicator: true});

      expect(custom.slot("custom-indicator").textContent).toBe("pick");
      custom.unmount();
    });

    it("submits the value under its name", () => {
      const picker = renderPicker({name: "appointment", value: jun(10)});
      const hidden = document.body.querySelector<HTMLInputElement>("input[name='appointment']")!;

      expect(hidden.value).toBe("2026-06-10");
      picker.unmount();
    });

    it("reads a bare boolean attribute as set", () => {
      /*
       * The form a caller actually writes. An imported indexed-access prop type compiles to a prop
       * with no runtime type, and Vue then hands `<DatePicker is-disabled>` the empty string.
       */
      const picker = renderPicker({attributeForm: true});

      expect(picker.root().getAttribute("data-disabled")).toBe("true");
      expect(picker.root().getAttribute("data-required")).toBe("true");
      picker.unmount();
    });
  });

  describe("the group it owns", () => {
    it("carries the picker's own name and role rather than the field's", () => {
      const picker = renderPicker({label: "Appointment"});
      const label = picker.slot("label");

      expect(picker.group().getAttribute("aria-labelledby")).toBe(label.id);
      // The field inside steps aside, so a screen reader does not announce the group twice.
      expect(picker.input().getAttribute("role")).toBe("presentation");
      picker.unmount();
    });

    it("has every segment read the picker's name after its own", () => {
      /*
       * A segment reads as a bare number, so it repeats what names the picker: "month, Appointment".
       * The trailing separator on its own label is what runs the two together.
       */
      const picker = renderPicker({label: "Appointment"});
      const month = picker.segment("month");

      expect(month.getAttribute("aria-labelledby")).toBe(`${month.id} ${picker.slot("label").id}`);
      expect(month.getAttribute("aria-label")).toBe("month, ");
      picker.unmount();
    });

    it("leaves the separator off a segment with nothing to run on to", () => {
      // A picker with no label: "month, " followed by nothing would be worse than "month".
      const picker = renderPicker();

      expect(picker.segment("month").getAttribute("aria-label")).toBe("month");
      picker.unmount();
    });

    it("carries the picker's id, which is what a label points at", () => {
      const picker = renderPicker({id: "appointment"});

      expect(picker.group().getAttribute("id")).toBe("appointment");
      picker.unmount();
    });

    it("reports the picker disabled without being told", () => {
      const picker = renderPicker({isDisabled: true});

      expect(picker.group().getAttribute("aria-disabled")).toBe("true");
      picker.unmount();
    });

    it("shows the picker's verdict about the value", async () => {
      const picker = renderPicker({isInvalid: true});

      await settle();

      expect(picker.group().getAttribute("data-invalid")).toBe("true");
      expect(picker.root().getAttribute("data-invalid")).toBe("true");
      picker.unmount();
    });

    it("describes the value in words, for a screen reader", () => {
      const picker = renderPicker({value: jun(10)});
      const describedBy = picker.group().getAttribute("aria-describedby");

      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)?.textContent).toContain("June");
      picker.unmount();
    });

    it("opens the popover on Alt with an arrow from a segment", async () => {
      const picker = renderPicker();

      picker.segment("month").dispatchEvent(
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

  describe("the field inside it", () => {
    it("edits the picker's value rather than one of its own", async () => {
      const onValueChange = vi.fn();
      const picker = renderPicker({onValueChange, value: jun(10)});

      picker.segment("day").dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          data: "2",
          inputType: "insertText",
        }),
      );
      await nextTick();

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(String(onValueChange.mock.calls[0]![0])).toBe("2026-06-02");
      picker.unmount();
    });

    it("shows the value the picker holds", () => {
      const picker = renderPicker({value: jun(10)});

      expect(picker.segment("day").textContent?.trim()).toBe("10");
      picker.unmount();
    });

    it("takes its shape from the granularity the picker was given", () => {
      const picker = renderPicker({
        granularity: "minute",
        value: new CalendarDateTime(2026, 6, 10, 14, 30),
      });

      expect(picker.segment("hour")).toBeTruthy();
      expect(picker.segment("minute")).toBeTruthy();
      picker.unmount();
    });

    it("never reaches a verdict of its own about the date", async () => {
      // The picker holds the bounds, so a field judging them too could disagree with it.
      const picker = renderPicker({minValue: jun(12), value: jun(10)});

      await settle();

      expect(picker.input().getAttribute("data-invalid")).toBeNull();
      picker.unmount();
    });
  });

  describe("the popover", () => {
    it("drives the calendar inside it from the picker's own value", async () => {
      const picker = renderPicker({defaultOpen: true, value: jun(10)});

      await settle();

      const selected = inPopover("calendar-cell").find(
        (cell) => cell.getAttribute("data-selected") === "true",
      );

      expect(selected?.textContent?.trim()).toBe("10");
      picker.unmount();
    });

    it("lets the calendar's own markup win over what the picker says", async () => {
      // The story labels the calendar itself while leaving everything else to the picker.
      const picker = renderPicker({defaultOpen: true});

      await settle();

      // The name is composed: the calendar's own label, then the range it is showing.
      expect(inPopover("calendar")[0]!.getAttribute("aria-label")).toContain("Selected date");
      picker.unmount();
    });

    it("passes the picker's bounds on, so an out-of-range day cannot be picked", async () => {
      const picker = renderPicker({defaultOpen: true, minValue: jun(10), value: jun(15)});

      await settle();

      const cell = inPopover("calendar-cell").find(
        (element) => element.textContent?.trim() === "5",
      )!;

      expect(cell.getAttribute("data-disabled")).toBe("true");
      picker.unmount();
    });

    it("takes the day a calendar cell was pressed for, and closes", async () => {
      const onValueChange = vi.fn();
      const picker = renderPicker({defaultOpen: true, onValueChange, value: jun(15)});

      await settle();

      const cell = inPopover("calendar-cell").find(
        (element) => element.textContent?.trim() === "20",
      )!;

      press(cell);
      await settle();

      expect(String(onValueChange.mock.calls.at(-1)?.[0])).toBe("2026-06-20");
      expect(popovers()).toHaveLength(0);
      picker.unmount();
    });

    it("stays open when the caller says picking a date should not close it", async () => {
      const picker = renderPicker({
        defaultOpen: true,
        shouldCloseOnSelect: false,
        value: jun(15),
      });

      await settle();

      const cell = inPopover("calendar-cell").find(
        (element) => element.textContent?.trim() === "20",
      )!;

      press(cell);
      await settle();

      expect(popovers()).toHaveLength(1);
      picker.unmount();
    });

    it("reports every change of the open state", async () => {
      const onOpenChange = vi.fn();
      const picker = renderPicker({onOpenChange});

      press(picker.trigger());
      await settle();

      expect(onOpenChange).toHaveBeenCalledWith(true);
      picker.unmount();
    });
  });

  describe("the trigger", () => {
    it("names itself and what it opens", () => {
      const picker = renderPicker({label: "Appointment"});
      const trigger = picker.trigger();

      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("aria-label")).toBe("Calendar");
      // Its own id first, then the picker's label: "Calendar, Appointment".
      expect(trigger.getAttribute("aria-labelledby")).toBe(
        `${trigger.id} ${picker.slot("label").id}`,
      );
      picker.unmount();
    });

    it("reads as expanded while the popover is open", async () => {
      const picker = renderPicker({defaultOpen: true});

      await settle();

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("true");
      // Held pressed for as long as it is, so it looks like what the popover belongs to.
      expect(picker.trigger().getAttribute("data-pressed")).toBe("true");
      picker.unmount();
    });

    it("goes out of action when the picker is read only", () => {
      // There is nothing to pick, so the calendar is not worth opening.
      const picker = renderPicker({isReadOnly: true});

      expect(picker.trigger().hasAttribute("disabled")).toBe(true);
      picker.unmount();
    });

    it("goes out of action when the picker is disabled", () => {
      const picker = renderPicker({isDisabled: true});

      expect(picker.trigger().hasAttribute("disabled")).toBe(true);
      picker.unmount();
    });
  });

  describe("focus", () => {
    it("reports focus entering and leaving the picker as a whole", async () => {
      const onFocusChange = vi.fn();
      const picker = renderPicker({onFocusChange});

      picker.segment("month").focus();
      await nextTick();

      expect(onFocusChange).toHaveBeenCalledWith(true);

      // Segment to segment never left the picker.
      onFocusChange.mockClear();
      picker.segment("day").focus();
      await nextTick();

      expect(onFocusChange).not.toHaveBeenCalled();
      picker.unmount();
    });
  });

  describe("validation", () => {
    it("reveals the range failure through the error message slot", async () => {
      const picker = renderPicker({
        errorMessage: "Pick a later date",
        minValue: jun(12),
        value: jun(10),
      });

      await settle();

      const message = picker.slot("error-message");
      const describedBy = picker.group().getAttribute("aria-describedby");

      expect(message).toBeTruthy();
      expect(describedBy).toContain(message.id);
      picker.unmount();
    });
  });
});
