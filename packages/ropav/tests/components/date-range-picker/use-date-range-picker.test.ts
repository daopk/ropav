import type { UseDateRangePickerReturn } from "@/components/date-range-picker/use-date-range-picker";
import type { DateRangePickerState } from "@/composables/use-date-range-picker-state";

import { CalendarDate } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Host from "../../fixtures/date-range-picker-host.vue";

type Ready = { picker: UseDateRangePickerReturn; state: DateRangePickerState };

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: Ready;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: Ready) => (ready = value),
  });

  const result = renderVapor(Host, { props });
  const slot = (name: string) =>
    result.container.querySelector<HTMLElement>(`[data-slot='${name}']`);

  return {
    ...result,
    group: () => slot("date-range-picker-group")!,
    label: () => slot("date-picker-label"),
    picker: () => ready.picker,
    segmentEnd: () => slot("date-range-picker-segment-end")!,
    segmentStart: () => slot("date-range-picker-segment-start")!,
    slot,
    state: () => ready.state,
    trigger: () => slot("date-range-picker-trigger")!,
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

describe("useDateRangePicker", () => {
  describe("the group around both rows of segments", () => {
    it("carries the group role", () => {
      expect(setup().group().getAttribute("role")).toBe("group");
    });

    it("takes the id it was given", () => {
      expect(setup({ id: "trip" }).group().getAttribute("id")).toBe("trip");
    });

    it("is named by its own label when there is one", () => {
      const picker = setup({ withLabel: true });

      expect(picker.group().getAttribute("aria-labelledby")).toBe(picker.label()!.id);
    });

    it("names itself when there is no label to point at", () => {
      // Circular on purpose, and upstream's: with no label the group is named by its contents, and
      // the trigger's own name is built from this — a dangling reference would leave it unnamed.
      const picker = setup();

      expect(picker.group().getAttribute("aria-labelledby")).toBe(picker.group().id);
    });

    it("reads as disabled without being made unfocusable", () => {
      expect(setup({ isDisabled: true }).group().getAttribute("aria-disabled")).toBe("true");
      expect(setup().group().hasAttribute("aria-disabled")).toBe(false);
    });

    it("describes the whole range in words", () => {
      const picker = setup({ value: { end: jun(20), start: jun(10) } });
      const describedBy = picker.group().getAttribute("aria-describedby");

      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)?.textContent).toContain("June");
    });

    it("says nothing about the value while the range is incomplete", () => {
      const picker = setup();
      const describedBy = picker.group().getAttribute("aria-describedby");

      // Not a dangling reference: the description element is only referenced once it has words.
      expect(describedBy).toBeNull();
    });
  });

  describe("moving along the row of segments", () => {
    it("steps over the button that opens the popover", () => {
      /*
       * The trigger sits between the two fields in real markup. A focus manager that accepted
       * everything focusable would land on it on the way from one field to the next.
       */
      const picker = setup();

      picker.picker().startField.focusManager.focusFirst();

      expect(document.activeElement).toBe(picker.segmentStart());

      picker.picker().startField.focusManager.focusNext();

      expect(document.activeElement).toBe(picker.segmentEnd());
    });

    it("gives both fields the same manager, because the row spans both", () => {
      const picker = setup();

      expect(picker.picker().startField.focusManager).toBe(picker.picker().endField.focusManager);
    });

    it("reaches the last segment of the second field from the end", () => {
      const picker = setup();

      picker.picker().endField.focusManager.focusLast();

      expect(document.activeElement).toBe(picker.segmentEnd());
    });
  });

  describe("the two fields", () => {
    it("names each end, so a bare number says which one it belongs to", () => {
      const picker = setup();

      expect(picker.picker().startField.ariaLabel.value).toBe("Start Date");
      expect(picker.picker().endField.ariaLabel.value).toBe("End Date");
    });

    it("has both read the picker's name after their own", () => {
      const picker = setup({ withLabel: true });

      expect(picker.picker().startField.ariaLabelledBy.value).toBe(picker.label()!.id);
      expect(picker.picker().endField.ariaLabelledBy.value).toBe(picker.label()!.id);
    });

    it("leaves both unlabelled when the picker has no label", () => {
      // The group falls back to naming itself; a segment reading "month, " and then the whole
      // group's contents would be worse than a segment reading "month".
      const picker = setup();

      expect(picker.picker().startField.ariaLabelledBy.value).toBeUndefined();
    });

    it("steps both aside from the group role", () => {
      const picker = setup();

      expect(picker.picker().startField.role).toBe("presentation");
      expect(picker.picker().endField.role).toBe("presentation");
    });

    it("has both describe the picker's own value rather than half of it", () => {
      const picker = setup({ value: { end: jun(20), start: jun(10) } });

      expect(picker.picker().startField.ariaDescribedBy.value).toBe(
        picker.group().getAttribute("aria-describedby"),
      );
    });
  });

  describe("the verdict the two fields report through", () => {
    it("merges what each end says into one", async () => {
      const picker = setup();
      const { endField, startField } = picker.picker();

      startField.validationState.updateValidation({
        isInvalid: true,
        validationDetails: {
          badInput: false,
          customError: false,
          patternMismatch: false,
          rangeOverflow: false,
          rangeUnderflow: true,
          stepMismatch: false,
          tooLong: false,
          tooShort: false,
          typeMismatch: false,
          valid: false,
          valueMissing: false,
        },
        validationErrors: ["Too early"],
      });
      endField.validationState.updateValidation({
        isInvalid: true,
        validationDetails: {
          badInput: false,
          customError: false,
          patternMismatch: false,
          rangeOverflow: true,
          rangeUnderflow: false,
          stepMismatch: false,
          tooLong: false,
          tooShort: false,
          typeMismatch: false,
          valid: false,
          valueMissing: false,
        },
        validationErrors: ["Too late"],
      });
      picker.state().commitValidation();
      await nextTick();

      const shown = picker.state().displayValidation.value;

      expect(shown.validationErrors).toEqual(["Too early", "Too late"]);
      expect(shown.validationDetails.rangeUnderflow).toBe(true);
      expect(shown.validationDetails.rangeOverflow).toBe(true);
    });

    it("remembers the other end when one end reports again", async () => {
      /*
       * A field only ever describes its own half, so the picker holds the last thing the other half
       * said — otherwise a second report from one end would erase the first from the other.
       */
      const picker = setup();
      const { endField, startField } = picker.picker();
      const failure = (message: string) => ({
        isInvalid: true,
        validationDetails: {
          badInput: true,
          customError: false,
          patternMismatch: false,
          rangeOverflow: false,
          rangeUnderflow: false,
          stepMismatch: false,
          tooLong: false,
          tooShort: false,
          typeMismatch: false,
          valid: false,
          valueMissing: false,
        },
        validationErrors: [message],
      });

      startField.validationState.updateValidation(failure("Start is unavailable"));
      endField.validationState.updateValidation(failure("End is unavailable"));
      endField.validationState.updateValidation(failure("End is still unavailable"));
      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().displayValidation.value.validationErrors).toEqual([
        "Start is unavailable",
        "End is still unavailable",
      ]);
    });

    it("shows both ends the same verdict", () => {
      const picker = setup();
      const { endField, startField } = picker.picker();

      expect(startField.validationState.displayValidation).toBe(picker.state().displayValidation);
      expect(endField.validationState.displayValidation).toBe(picker.state().displayValidation);
    });
  });

  describe("the trigger", () => {
    it("names itself and what it opens", () => {
      const picker = setup({ withLabel: true });
      const trigger = picker.trigger();

      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
      expect(trigger.getAttribute("aria-label")).toBe("Calendar");
      expect(trigger.getAttribute("aria-labelledby")).toBe(`${trigger.id} ${picker.label()!.id}`);
    });

    it("reports whether the popover is open", async () => {
      const picker = setup();

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("false");

      picker.picker().onTriggerPress();
      await nextTick();

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("true");
    });

    it("only ever opens, never toggles", () => {
      // Closing is the popover's own business — dismissing it is what puts it away.
      const picker = setup();

      picker.picker().onTriggerPress();
      picker.picker().onTriggerPress();

      expect(picker.state().isOpen.value).toBe(true);
    });

    it("goes out of action when there is nothing to pick", () => {
      expect(setup({ isReadOnly: true }).picker().isTriggerDisabled.value).toBe(true);
      expect(setup({ isDisabled: true }).picker().isTriggerDisabled.value).toBe(true);
      expect(setup().picker().isTriggerDisabled.value).toBe(false);
    });
  });

  describe("the dialog", () => {
    it("is named by the trigger and the picker together", async () => {
      const picker = setup({ withLabel: true });

      picker.picker().onTriggerPress();
      await nextTick();

      const dialog = picker.slot("date-range-picker-dialog")!;

      expect(dialog.getAttribute("aria-labelledby")).toBe(
        `${picker.trigger().id} ${picker.label()!.id}`,
      );
    });
  });

  describe("the calendar in the popover", () => {
    it("takes focus as it appears, because that is what the popover is for", () => {
      expect(setup().picker().calendarProps.value.autoFocus).toBe(true);
    });

    it("draws only a complete range", () => {
      const picker = setup();

      expect(picker.picker().calendarProps.value.value).toBeNull();

      picker.state().setValue({ end: jun(20), start: jun(10) });

      expect(String(picker.picker().calendarProps.value.value?.start)).toBe("2026-06-10");
    });

    it("passes the picker's bounds on", () => {
      const picker = setup({ maxValue: jun(25), minValue: jun(5) });

      expect(String(picker.picker().calendarProps.value.minValue)).toBe("2026-06-05");
      expect(String(picker.picker().calendarProps.value.maxValue)).toBe("2026-06-25");
    });

    it("writes a range picked in the calendar back to the picker", () => {
      const picker = setup();

      picker.picker().calendarProps.value.onChange({ end: jun(20), start: jun(10) });

      expect(String(picker.state().value.value.start)).toBe("2026-06-10");
    });

    it("hands the picker's verdict on once it is revealed", async () => {
      const picker = setup({ minValue: jun(12), value: { end: jun(20), start: jun(10) } });

      // Held back until a commit, which is what `native` behaviour means.
      expect(picker.picker().calendarProps.value.isInvalid).toBe(false);

      picker.state().commitValidation();
      await nextTick();

      expect(picker.picker().calendarProps.value.isInvalid).toBe(true);
    });
  });

  describe("focus", () => {
    it("reports focus entering and leaving the picker as a whole", async () => {
      const onFocusChange = vi.fn();
      const picker = setup({ onFocusChange });

      picker.segmentStart().focus();
      await nextTick();

      expect(onFocusChange).toHaveBeenCalledWith(true);

      // Moving from one field to the other never left the picker.
      onFocusChange.mockClear();
      picker.segmentEnd().focus();
      await nextTick();

      expect(onFocusChange).not.toHaveBeenCalled();
    });
  });
});
