import type {DateRange} from "@/composables/use-calendar";
import type {DateRangePickerState} from "@/composables/use-date-range-picker-state";
import type {DateValue} from "@internationalized/date";

import {CalendarDate, CalendarDateTime, Time, ZonedDateTime} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/date-range-picker-state-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let state!: DateRangePickerState;

  Object.assign(props, {
    onReady: (value: DateRangePickerState) => (state = value),
    validationBehavior: props["validationBehavior"] ?? "native",
  });

  return {...renderVapor(Host, {props}), state: () => state};
};

const jun = (day: number) => new CalendarDate(2026, 6, day);
const junAt = (day: number, hour: number, minute = 0) =>
  new CalendarDateTime(2026, 6, day, hour, minute);

/** A range read back as two strings, which is how every expectation below is written. */
const read = (range: {start: unknown; end: unknown} | null) =>
  range == null ? null : {end: String(range.end), start: String(range.start)};

/*
 * Every expectation below was read off react-stately's own `useDateRangePickerState` driven through
 * the same sequence, rather than derived by hand.
 */

describe("useDateRangePickerState", () => {
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

    it("starts open when the caller says so", () => {
      expect(setup({defaultOpen: true}).state().isOpen.value).toBe(true);
    });

    it("stays where the caller holds it", () => {
      const onOpenChange = vi.fn();
      const picker = setup({isOpen: false, onOpenChange});

      picker.state().setOpen(true);

      expect(picker.state().isOpen.value).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("the range on screen", () => {
    it("starts empty", () => {
      const picker = setup();

      expect(read(picker.state().value.value)).toEqual({end: "null", start: "null"});
    });

    it("shows the range the caller owns", () => {
      const picker = setup({value: {end: jun(20), start: jun(10)}});

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
    });

    it("holds one end on its own without emitting anything", () => {
      const onChange = vi.fn();
      const picker = setup({onChange});

      picker.state().setValue({end: null, start: jun(10)});

      expect(read(picker.state().value.value)).toEqual({end: "null", start: "2026-06-10"});
      // Half a range is not a value: what the caller owns was nothing and stays nothing.
      expect(onChange).not.toHaveBeenCalled();
    });

    it("emits once both ends are known", () => {
      const onChange = vi.fn();
      const picker = setup({onChange});

      picker.state().setValue({end: jun(20), start: jun(10)});

      expect(read(onChange.mock.calls.at(-1)?.[0])).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
    });

    it("forgets a range the caller takes away", async () => {
      /*
       * A controlled range going to null is the one way the range on screen can outlive the value:
       * what is shown has to go with it rather than lingering as a half-typed range.
       */
      let state!: DateRangePickerState;

      /*
       * Passed by reference rather than spread: `renderVapor` reads each key through a getter, so a
       * `reactive` object handed in here keeps driving the component after it is mounted.
       */
      const props = reactive({
        onReady: (next: DateRangePickerState) => (state = next),
        validationBehavior: "native" as const,
        value: {end: jun(20), start: jun(10)} as DateRange | null,
      });
      const result = renderVapor(Host, {props});

      expect(read(state.value.value)).toEqual({end: "2026-06-20", start: "2026-06-10"});

      props.value = null;
      await nextTick();

      expect(read(state.value.value)).toEqual({end: "null", start: "null"});
      result.unmount();
    });

    it("sets one end at a time from a field", () => {
      const picker = setup();

      picker.state().setDateTime("start", jun(10));
      picker.state().setDateTime("end", jun(20));

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
    });
  });

  describe("the two halves of a range with times", () => {
    const withTime = {granularity: "minute", placeholderValue: junAt(15, 8)};

    it("keeps days and times apart until both are known", () => {
      const onChange = vi.fn();
      const picker = setup({...withTime, onChange, shouldCloseOnSelect: false});

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      // Days alone are not a value yet: the times are still missing.
      expect(read(picker.state().dateRange.value)).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
      expect(read(picker.state().value.value)).toEqual({end: "null", start: "null"});

      picker.state().setTimeRange({end: new Time(17, 30), start: new Time(9)});

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20T17:30:00",
        start: "2026-06-10T09:00:00",
      });
    });

    it("assembles them in either order", () => {
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setTimeRange({end: new Time(17, 30), start: new Time(9)});

      expect(read(picker.state().value.value)).toEqual({end: "null", start: "null"});

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20T17:30:00",
        start: "2026-06-10T09:00:00",
      });
    });

    it("stands a placeholder time in when picking days closes the popover", () => {
      // There is no chance left to pick a time, so the field must not be left half filled.
      const picker = setup(withTime);

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20T08:00:00",
        start: "2026-06-10T08:00:00",
      });
    });

    it("commits the days when the popover is closed with no time chosen", () => {
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(read(picker.state().value.value)).toEqual({end: "null", start: "null"});

      picker.state().setOpen(false);

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20T08:00:00",
        start: "2026-06-10T08:00:00",
      });
    });

    it("keeps times picked with no days, rather than committing them", () => {
      /*
       * There are no days to put them on. The halves are held so that reopening the popover carries
       * on where the user left off.
       */
      const picker = setup({...withTime, shouldCloseOnSelect: false});

      picker.state().setOpen(true);
      picker.state().setTimeRange({end: new Time(8), start: new Time(6)});
      picker.state().setOpen(false);

      expect(read(picker.state().value.value)).toEqual({end: "null", start: "null"});
      expect(read(picker.state().timeRange.value)).toEqual({end: "08:00:00", start: "06:00:00"});
    });

    it("folds a day into a zoned time rather than the other way round", () => {
      // A zoned time carries its own zone and offset, and picking a day must not throw them away.
      const picker = setup({
        granularity: "minute",
        shouldCloseOnSelect: false,
        value: {
          end: new ZonedDateTime(2026, 6, 20, "America/New_York", -14400000, 17, 30),
          start: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 9, 0),
        },
      });
      const onChange = vi.fn();
      const controlled = setup({
        granularity: "minute",
        onChange,
        placeholderValue: new ZonedDateTime(2026, 6, 15, "America/New_York", -14400000, 8, 0),
        shouldCloseOnSelect: false,
      });

      controlled.state().setTimeRange({
        end: new ZonedDateTime(2026, 6, 1, "America/New_York", -14400000, 17, 30),
        start: new ZonedDateTime(2026, 6, 1, "America/New_York", -14400000, 9, 0),
      });
      controlled.state().setDateRange({end: jun(20), start: jun(10)});

      expect(read(controlled.state().value.value)).toEqual({
        end: "2026-06-20T17:30:00-04:00[America/New_York]",
        start: "2026-06-10T09:00:00-04:00[America/New_York]",
      });
      expect(picker.state().hasTime.value).toBe(true);
    });

    it("moves one end's time without disturbing the other", () => {
      const picker = setup({
        defaultValue: {end: junAt(20, 17, 30), start: junAt(10, 9)},
        granularity: "minute",
      });

      picker.state().setTime("start", new Time(7, 15));

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-20T17:30:00",
        start: "2026-06-10T07:15:00",
      });
    });

    it("moves one end's day without disturbing the times", () => {
      const picker = setup({
        defaultValue: {end: junAt(20, 17, 30), start: junAt(10, 9)},
        granularity: "minute",
      });

      picker.state().setDate("end", jun(22));

      expect(read(picker.state().value.value)).toEqual({
        end: "2026-06-22T17:30:00",
        start: "2026-06-10T09:00:00",
      });
    });
  });

  describe("closing on select", () => {
    it("closes as soon as a range is picked", () => {
      const picker = setup({defaultOpen: true});

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(picker.state().isOpen.value).toBe(false);
    });

    it("stays open when the caller says so", () => {
      const picker = setup({defaultOpen: true, shouldCloseOnSelect: false});

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(picker.state().isOpen.value).toBe(true);
    });

    it("asks a callback each time", () => {
      const shouldCloseOnSelect = vi.fn(() => false);
      const picker = setup({defaultOpen: true, shouldCloseOnSelect});

      picker.state().setDateRange({end: jun(20), start: jun(10)});

      expect(shouldCloseOnSelect).toHaveBeenCalled();
      expect(picker.state().isOpen.value).toBe(true);
    });
  });

  describe("granularity", () => {
    it("follows the value it holds", () => {
      expect(setup({value: {end: jun(20), start: jun(10)}}).state().granularity.value).toBe("day");
      expect(
        setup({value: {end: junAt(20, 17, 30), start: junAt(10, 9)}}).state().granularity.value,
      ).toBe("minute");
    });

    it("follows the placeholder before anything is chosen", () => {
      expect(setup({placeholderValue: junAt(15, 8)}).state().granularity.value).toBe("minute");
    });

    it("is whatever the caller asked for", () => {
      const picker = setup({granularity: "hour", placeholderValue: junAt(15, 8)});

      expect(picker.state().granularity.value).toBe("hour");
      expect(picker.state().hasTime.value).toBe(true);
    });

    it("has no time at all for a date-only range", () => {
      expect(setup({value: {end: jun(20), start: jun(10)}}).state().hasTime.value).toBe(false);
    });
  });

  describe("validation", () => {
    it("judges both ends against the bounds", async () => {
      const picker = setup({
        minValue: jun(12),
        value: {end: jun(20), start: jun(10)},
      });

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
      expect(picker.state().displayValidation.value.validationDetails.rangeUnderflow).toBe(true);
    });

    it("says one thing when both ends fail the same way", async () => {
      const picker = setup({maxValue: jun(18), value: {end: jun(25), start: jun(20)}});

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().displayValidation.value.validationErrors).toHaveLength(1);
    });

    it("reports a range that runs backwards", async () => {
      const picker = setup({value: {end: jun(10), start: jun(20)}});

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
      // Neither end alone is at fault, so it reads as both an overflow and an underflow.
      const details = picker.state().displayValidation.value.validationDetails;

      expect(details.rangeOverflow).toBe(true);
      expect(details.rangeUnderflow).toBe(true);
    });

    it("takes no view on the days between the two ends", async () => {
      // Whether a range may span an unavailable date is the calendar's decision, not this one's.
      const picker = setup({
        isDateUnavailable: (date: DateValue) => date.compare(jun(15)) === 0,
        value: {end: jun(20), start: jun(10)},
      });

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(false);
    });

    it("rules out an end that is unavailable", async () => {
      const picker = setup({
        isDateUnavailable: (date: DateValue) => date.compare(jun(20)) === 0,
        value: {end: jun(20), start: jun(10)},
      });

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
      expect(picker.state().displayValidation.value.validationDetails.badInput).toBe(true);
    });

    it("reads as invalid when the caller says so, whatever it holds", () => {
      expect(
        setup({isInvalid: true, value: {end: jun(20), start: jun(10)}}).state().isInvalid.value,
      ).toBe(true);
    });

    it("holds a range failure back until it is committed", async () => {
      // What `native` behaviour means: nothing is revealed until the form asks.
      const picker = setup({minValue: jun(12), value: {end: jun(20), start: jun(10)}});

      expect(picker.state().isInvalid.value).toBe(false);

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().isInvalid.value).toBe(true);
    });

    it("reveals it at once under aria behaviour", () => {
      const picker = setup({
        minValue: jun(12),
        validationBehavior: "aria",
        value: {end: jun(20), start: jun(10)},
      });

      expect(picker.state().isInvalid.value).toBe(true);
    });

    it("asks the caller's own rule as well", async () => {
      const picker = setup({
        validate: (value: DateRange | null) => (value && value.end.day > 15 ? "too long" : null),
        value: {end: jun(20), start: jun(10)},
      });

      picker.state().commitValidation();
      await nextTick();

      expect(picker.state().displayValidation.value.validationErrors).toEqual(["too long"]);
    });
  });

  describe("the range in words", () => {
    it("says nothing while the range is incomplete", () => {
      expect(setup().state().formatValue("en-US", {})).toBeNull();
      expect(
        setup({value: {end: null, start: jun(10)} as never})
          .state()
          .formatValue("en-US", {}),
      ).toBeNull();
    });

    it("writes the two ends out, sharing whatever they have in common", () => {
      // Formatted as one range, which is shorter wherever the ends share a part.
      const picker = setup({value: {end: jun(20), start: jun(10)}});

      expect(picker.state().formatValue("en-US", {month: "long"})).toEqual({
        end: "20, 2026",
        start: "June 10",
      });
    });

    it("writes them out separately when they share nothing to shorten", () => {
      const picker = setup({value: {end: jun(10), start: jun(10)}});

      expect(picker.state().formatValue("en-US", {})).toEqual({
        end: "6/10/2026",
        start: "6/10/2026",
      });
    });

    it("writes them out separately when the two ends are in different zones", () => {
      const picker = setup({
        value: {
          end: new ZonedDateTime(2026, 6, 20, "Europe/Paris", 7200000, 17, 30),
          start: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 9, 0),
        },
      });

      expect(picker.state().formatValue("en-US", {})).toEqual({
        end: "6/20/2026, 5:30 PM GMT+2",
        start: "6/10/2026, 9:00 AM EDT",
      });
    });

    it("hands out a formatter built from its own options", () => {
      const picker = setup({hourCycle: 24, value: {end: junAt(20, 17, 30), start: junAt(10, 9)}});
      const formatter = picker.state().getDateFormatter("en-US", {});

      expect(formatter.format(new Date(Date.UTC(2026, 5, 10, 21, 0)))).toContain("21:00");
    });
  });

  describe("what a form is reset to", () => {
    it("is the range it started with", () => {
      const picker = setup({defaultValue: {end: jun(20), start: jun(10)}});

      picker.state().setValue({end: jun(25), start: jun(15)});

      expect(read(picker.state().defaultValue.value)).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
    });

    it("is the range a controlled picker was mounted with", () => {
      const picker = setup({value: {end: jun(20), start: jun(10)}});

      expect(read(picker.state().defaultValue.value)).toEqual({
        end: "2026-06-20",
        start: "2026-06-10",
      });
    });
  });
});
