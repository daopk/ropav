import type {DatePickerState} from "@/composables/use-date-picker-state";
import type {DateValue} from "@internationalized/date";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDate, CalendarDateTime, Time, ZonedDateTime} from "@internationalized/date";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/date-picker-state-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let state!: DatePickerState;

  Object.assign(props, {
    onReady: (value: DatePickerState) => (state = value),
    validationBehavior: props["validationBehavior"] ?? "native",
  });

  return {...renderVapor(Host, {props}), state: () => state};
};

const jun = (day: number) => new CalendarDate(2026, 6, day);
const junAt = (day: number, hour: number, minute = 0) =>
  new CalendarDateTime(2026, 6, day, hour, minute);

/*
 * Every expectation below was read off react-stately's own `useDatePickerState` driven through the
 * same sequence, rather than derived by hand.
 */

describe("useDatePickerState", () => {
  describe("the popover", () => {
    it("starts closed", () => {
      expect(setup().state().isOpen.value).toBe(false);
    });

    it("opens when asked to", () => {
      const onOpenChange = vi.fn();
      const picker = setup({onOpenChange});

      picker.state().setOpen(true);

      expect(picker.state().isOpen.value).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("takes a default open state", () => {
      expect(setup({defaultOpen: true}).state().isOpen.value).toBe(true);
    });

    it("only reports a controlled open state", () => {
      const onOpenChange = vi.fn();
      const picker = setup({isOpen: false, onOpenChange});

      picker.state().setOpen(true);

      expect(picker.state().isOpen.value).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("how precise the picker is", () => {
    it("takes the day from a plain value", () => {
      const picker = setup({value: jun(10)});

      expect(picker.state().granularity.value).toBe("day");
      expect(picker.state().hasTime.value).toBe(false);
    });

    it("takes the minute from a value that carries a time", () => {
      const picker = setup({value: junAt(10, 13, 45)});

      expect(picker.state().granularity.value).toBe("minute");
      expect(picker.state().hasTime.value).toBe(true);
    });

    it("learns its shape from a placeholder before anything is chosen", () => {
      expect(setup({placeholderValue: junAt(15, 8)}).state().hasTime.value).toBe(true);
    });

    it("takes what the caller asked for", () => {
      expect(
        setup({granularity: "second", placeholderValue: junAt(15, 8)}).state().granularity.value,
      ).toBe("second");
    });
  });

  describe("picking a date on a date-only picker", () => {
    it("commits it and closes", () => {
      const onChange = vi.fn();
      const picker = setup({onChange});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));

      expect(String(picker.state().value.value)).toBe("2026-06-10");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(picker.state().isOpen.value).toBe(false);
    });

    it("stays open when told not to close", () => {
      const picker = setup({shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));

      expect(String(picker.state().value.value)).toBe("2026-06-10");
      expect(picker.state().isOpen.value).toBe(true);
    });

    it("asks a callback whether to close, each time", () => {
      let shouldClose = false;
      const picker = setup({shouldCloseOnSelect: () => shouldClose});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));

      expect(picker.state().isOpen.value).toBe(true);

      shouldClose = true;
      picker.state().setDateValue(jun(11));

      expect(picker.state().isOpen.value).toBe(false);
    });
  });

  describe("assembling a date and a time", () => {
    const withTime = {granularity: "minute" as const, placeholderValue: junAt(15, 8)};

    it("commits with a placeholder time when the popover closes on the press", () => {
      // Closing immediately leaves no chance to pick a time, so the placeholder's stands in.
      const picker = setup({...withTime, placeholderValue: junAt(15, 8)});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));

      expect(String(picker.state().value.value)).toBe("2026-06-10T08:00:00");
    });

    it("holds the date on its own while the popover stays open", () => {
      const onChange = vi.fn();
      const picker = setup({...withTime, onChange, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));

      expect(picker.state().value.value).toBeNull();
      expect(String(picker.state().dateValue.value)).toBe("2026-06-10");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("commits once the time arrives too", () => {
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));
      picker.state().setTimeValue(new Time(13, 45));

      expect(String(picker.state().value.value)).toBe("2026-06-10T13:45:00");
    });

    it("takes the two halves in the other order as well", () => {
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setTimeValue(new Time(13, 45));

      expect(picker.state().value.value).toBeNull();
      expect(String(picker.state().timeValue.value)).toBe("13:45:00");

      picker.state().setDateValue(jun(10));

      expect(String(picker.state().value.value)).toBe("2026-06-10T13:45:00");
    });

    it("commits a date left without a time when the popover closes", () => {
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setDateValue(jun(10));
      picker.state().setOpen(false);

      expect(String(picker.state().value.value)).toBe("2026-06-10T08:00:00");
    });

    it("keeps a time left without a date instead of committing it", () => {
      // There is no day to put the time on, so the half is held until the user comes back to it.
      const onChange = vi.fn();
      const picker = setup({...withTime, onChange, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setTimeValue(new Time(13, 45));
      picker.state().setOpen(false);

      expect(picker.state().value.value).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
      expect(String(picker.state().timeValue.value)).toBe("13:45:00");
    });

    it("leaves a time typed earlier standing when a date-only value is picked", () => {
      const picker = setup();

      picker.state().setTimeValue(new Time(13, 45));
      picker.state().setDateValue(jun(10));

      expect(String(picker.state().value.value)).toBe("2026-06-10");
      expect(String(picker.state().timeValue.value)).toBe("13:45:00");
    });

    it("folds the date into a zoned time, keeping its zone and offset", () => {
      const picker = setup({
        defaultValue: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 13, 45),
      });

      // A zoned time is the one that survives whole: the date is folded into it rather than the
      // other way round, so neither the zone nor the offset is recomputed.
      picker
        .state()
        .setTimeValue(new ZonedDateTime(2026, 6, 20, "America/New_York", -14400000, 9, 30));

      expect(String(picker.state().value.value)).toBe(
        "2026-06-10T09:30:00-04:00[America/New_York]",
      );
    });

    it("drops the zone when the time handed over has none", () => {
      // A bare `Time` cannot carry one, so the two are combined into a plain date-time. Surprising,
      // and exactly what upstream does.
      const picker = setup({
        defaultValue: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 13, 45),
      });

      picker.state().setTimeValue(new Time(9, 30));

      expect(String(picker.state().value.value)).toBe("2026-06-10T09:30:00");
    });
  });

  describe("the value written out", () => {
    it("is empty with nothing selected", () => {
      expect(setup().state().formatValue("en-US", {month: "long"})).toBe("");
    });

    it("spells the month out when asked", () => {
      expect(
        setup({value: jun(10)})
          .state()
          .formatValue("en-US", {month: "long"}),
      ).toBe("June 10, 2026");
    });

    it("includes the time when the value has one", () => {
      expect(
        setup({value: junAt(10, 13, 45)})
          .state()
          .formatValue("en-US", {month: "long"}),
      ).toBe("June 10, 2026 at 1:45 PM");
    });

    it("follows the locale it is handed", () => {
      expect(
        setup({value: jun(10)})
          .state()
          .formatValue("de-DE", {month: "long"}),
      ).toBe("10. Juni 2026");
    });

    it("hands out a formatter built from its own options", () => {
      const formatter = setup({value: junAt(10, 13, 45)})
        .state()
        .getDateFormatter("en-US", {granularity: "minute"});

      expect(formatter.format(new Date(Date.UTC(2026, 5, 10, 13, 45)))).toContain("1:45");
    });
  });

  describe("validity", () => {
    it("reports a value below the minimum once it is revealed", async () => {
      const picker = setup({minValue: jun(12), validationBehavior: "aria", value: jun(10)});

      expect(picker.state().isInvalid.value).toBe(true);
      expect(picker.state().displayValidation.value.validationErrors).toEqual([
        "Value must be 6/12/2026 or later.",
      ]);
      await nextTick();
    });

    it("holds a native verdict back until something commits it", async () => {
      const picker = setup({minValue: jun(12), value: jun(10)});

      expect(picker.state().realtimeValidation.value.isInvalid).toBe(true);
      expect(picker.state().isInvalid.value).toBe(false);

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
    });

    it("reveals it as soon as a date is picked", async () => {
      const picker = setup({minValue: jun(12)});

      picker.state().setDateValue(jun(10));
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
    });

    it("runs a custom validator on the value", async () => {
      const picker = setup({
        validate: (value: DateValue | null) => (value && value.day > 15 ? "too late" : null),
        validationBehavior: "aria",
        value: jun(20),
      });

      expect(picker.state().displayValidation.value.validationErrors).toEqual(["too late"]);
      await nextTick();
    });

    it("takes the caller's word for it", () => {
      expect(setup({isInvalid: true}).state().isInvalid.value).toBe(true);
    });

    it("lets a claim of validity shadow its own bounds", () => {
      expect(
        setup({isInvalid: false, minValue: jun(12), value: jun(10)}).state().isInvalid.value,
      ).toBe(false);
    });

    it("reports a date the caller ruled out", () => {
      const picker = setup({
        isDateUnavailable: (date: DateValue) => date.day === 10,
        validationBehavior: "aria",
        value: jun(10),
      });

      expect(picker.state().isInvalid.value).toBe(true);
    });
  });

  describe("the value the caller controls", () => {
    it("only reports a controlled value, leaving the owner to write it", () => {
      const onChange = vi.fn();
      const picker = setup({onChange, value: jun(10)});

      picker.state().setDateValue(jun(20));

      expect(String(picker.state().value.value)).toBe("2026-06-10");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("remembers what it started with, for a form reset", () => {
      const picker = setup({defaultValue: jun(10)});

      picker.state().setValue(jun(20));

      expect(String(picker.state().defaultValue.value)).toBe("2026-06-10");
    });
  });
});
