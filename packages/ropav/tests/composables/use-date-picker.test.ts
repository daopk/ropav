import type { UseDatePickerReturn } from "@/composables/use-date-picker";
import type { DatePickerState } from "@/composables/use-date-picker-state";

import { CalendarDate } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/date-picker-host.vue";

type Ready = { picker: UseDatePickerReturn; state: DatePickerState };

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
    group: () => slot("date-picker-group")!,
    label: () => slot("date-picker-label"),
    picker: () => ready.picker,
    slot,
    state: () => ready.state,
    trigger: () => slot("date-picker-trigger")!,
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

describe("useDatePicker", () => {
  describe("the group around the segments", () => {
    it("carries the group role", () => {
      expect(setup().group().getAttribute("role")).toBe("group");
    });

    it("takes the id it was given", () => {
      expect(setup({ id: "appointment" }).group().getAttribute("id")).toBe("appointment");
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

    it("prefers an explicit reference over its own label", () => {
      const picker = setup({ ariaLabelledby: "outside", withLabel: true });

      expect(picker.group().getAttribute("aria-labelledby")).toBe("outside");
    });

    it("states aria-disabled only while disabled", () => {
      expect(setup({ isDisabled: true }).group().getAttribute("aria-disabled")).toBe("true");
      expect(setup().group().getAttribute("aria-disabled")).toBeNull();
    });

    it("describes the selected value in words", () => {
      // The segments read as bare numbers, so the month spelled out is what makes them a date.
      const picker = setup({ value: jun(10) });
      const describedBy = picker.group().getAttribute("aria-describedby")!;
      const described = document.getElementById(describedBy.split(" ")[0]!);

      expect(described?.textContent).toBe("Selected Date: June 10, 2026");
    });

    it("says nothing about a value it does not have", () => {
      expect(setup().group().getAttribute("aria-describedby")).toBeNull();
    });

    it("keeps a caller's own description alongside its value", () => {
      const describedBy = setup({ ariaDescribedby: "hint", value: jun(10) })
        .group()
        .getAttribute("aria-describedby")!;

      expect(describedBy.split(" ")).toHaveLength(2);
      expect(describedBy.endsWith("hint")).toBe(true);
    });
  });

  describe("the trigger", () => {
    it("says it opens a dialog", () => {
      expect(setup().trigger().getAttribute("aria-haspopup")).toBe("dialog");
    });

    it("is named for the calendar it opens, then for the field", () => {
      const picker = setup({ withLabel: true });

      expect(picker.trigger().getAttribute("aria-label")).toBe("Calendar");
      expect(picker.trigger().getAttribute("aria-labelledby")).toBe(
        `${picker.trigger().id} ${picker.label()!.id}`,
      );
    });

    it("reports whether the popover is open", async () => {
      const picker = setup();

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("false");

      picker.trigger().click();
      await nextTick();

      expect(picker.trigger().getAttribute("aria-expanded")).toBe("true");
      expect(picker.state().isOpen.value).toBe(true);
    });
  });

  describe("the dialog", () => {
    it("is named by the trigger and the field together", async () => {
      const picker = setup({ withLabel: true });

      picker.trigger().click();
      await nextTick();

      expect(picker.slot("date-picker-dialog")!.getAttribute("aria-labelledby")).toBe(
        `${picker.trigger().id} ${picker.label()!.id}`,
      );
    });
  });

  describe("what it hands the field inside", () => {
    it("makes the field's own group presentational", () => {
      // The picker already carries the group role, its name and its description; a second group
      // role on the segments would have a screen reader announce the same thing twice.
      expect(setup().picker().field.role).toBe("presentation");
    });

    it("gives the field an id of its own, not the group's", () => {
      const picker = setup({ id: "appointment" });

      expect(picker.picker().field.id.value).not.toBe("appointment");
    });

    it("shares its own validation state, so the two cannot disagree", () => {
      const picker = setup();

      expect(picker.picker().field.validationState).toBe(picker.state());
    });

    it("shares a focus manager, so arrows can cross a field boundary", () => {
      const picker = setup();

      picker.picker().field.focusManager.focusFirst();

      expect(document.activeElement).toBe(picker.slot("date-picker-segment"));
    });

    it("hands on the same description the group carries", () => {
      const picker = setup({ value: jun(10) });

      expect(picker.picker().field.ariaDescribedBy.value).toBe(
        picker.group().getAttribute("aria-describedby"),
      );
    });
  });

  describe("what it hands the calendar", () => {
    it("asks for focus, because the popover exists to be navigated", () => {
      expect(setup().picker().calendarProps.value["autoFocus"]).toBe(true);
    });

    it("passes whichever date the picker is currently holding", () => {
      const picker = setup();

      expect(picker.picker().calendarProps.value["value"]).toBeNull();

      picker.state().setValue(jun(10));

      expect(String(picker.picker().calendarProps.value["value"])).toBe("2026-06-10");
    });

    it("passes its own invalid state on once it is revealed", async () => {
      const picker = setup({ minValue: jun(12), value: jun(10) });

      // Held back until a commit, which is what `native` behaviour means.
      expect(picker.picker().calendarProps.value["isInvalid"]).toBe(false);

      picker.state().commitValidation();
      await nextTick();

      expect(picker.picker().calendarProps.value["isInvalid"]).toBe(true);
    });

    it("passes disabled and read only straight through", () => {
      const picker = setup({ isDisabled: true, isReadOnly: true });

      expect(picker.picker().calendarProps.value["isDisabled"]).toBe(true);
      expect(picker.picker().calendarProps.value["isReadOnly"]).toBe(true);
    });
  });
});
