import type { DateFieldState } from "@/composables/use-date-field-state";
import type { DateValue } from "@internationalized/date";

import { CalendarDate, CalendarDateTime, createCalendar } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Host from "../fixtures/date-field-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let state!: DateFieldState;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: DateFieldState) => (state = value),
  });

  const result = renderVapor(Host, { props });

  return {
    ...result,
    state: () => state,
    texts: () => state.segments.value.map((segment) => segment.text),
    types: () => state.segments.value.map((segment) => segment.type),
  };
};

describe("useDateFieldState", () => {
  describe("which segments a field has", () => {
    it("follows the locale's own date order", () => {
      // Same three segments, three different orders — the field's shape is the locale's, not ours.
      expect(setup({ granularity: "day", locale: "en-US" }).types()).toEqual([
        "month",
        "literal",
        "day",
        "literal",
        "year",
      ]);
      expect(setup({ granularity: "day", locale: "en-GB" }).types()).toEqual([
        "day",
        "literal",
        "month",
        "literal",
        "year",
      ]);
      expect(setup({ granularity: "day", locale: "ja-JP" }).types()).toEqual([
        "year",
        "literal",
        "month",
        "literal",
        "day",
      ]);
    });

    it("adds time segments for a finer granularity", () => {
      const { types } = setup({ granularity: "minute", locale: "en-US" });

      expect(types()).toContain("hour");
      expect(types()).toContain("minute");
      // A 12-hour locale gets a period segment; the value has nowhere else to say AM or PM.
      expect(types()).toContain("dayPeriod");
    });

    it("leaves the period out of a 24-hour locale", () => {
      expect(setup({ granularity: "minute", locale: "de-DE" }).types()).not.toContain("dayPeriod");
    });

    it("gives a time field only its time segments", () => {
      // This is all a time field is: a date field whose window starts at the hour.
      const { types } = setup({ granularity: "minute", locale: "de-DE", maxGranularity: "hour" });

      expect(types().filter((type) => type !== "literal")).toEqual(["hour", "minute"]);
    });
  });

  describe("what an empty field shows", () => {
    it("shows the locale's own placeholder words", () => {
      expect(setup({ granularity: "day", locale: "en-US" }).texts()).toEqual([
        "mm",
        "/",
        "dd",
        "/",
        "yyyy",
      ]);
      // German spells them for *Tag*, *Monat*, *Jahr*, following its own `<input type="date">`.
      expect(setup({ granularity: "day", locale: "de-DE" }).texts()).toEqual([
        "tt",
        ".",
        "mm",
        ".",
        "jjjj",
      ]);
    });

    it("shows dashes for a blank time segment", () => {
      const { state } = setup({ granularity: "minute", locale: "de-DE", maxGranularity: "hour" });
      const time = state().segments.value.filter((s) => s.type === "hour" || s.type === "minute");

      expect(time.map((s) => s.text)).toEqual(["––", "––"]);
    });

    it("marks every editable segment as a placeholder", () => {
      const { state } = setup({ granularity: "day" });

      expect(
        state()
          .segments.value.filter((s) => s.isEditable)
          .every((s) => s.isPlaceholder),
      ).toBe(true);
    });
  });

  describe("what a filled field shows", () => {
    it("shows the value, unpadded by default", () => {
      expect(setup({ granularity: "day", value: new CalendarDate(2026, 6, 5) }).texts()).toEqual([
        "6",
        "/",
        "5",
        "/",
        "2026",
      ]);
    });

    it("pads month and day on request", () => {
      expect(
        setup({
          granularity: "day",
          shouldForceLeadingZeros: true,
          value: new CalendarDate(2026, 6, 5),
        }).texts(),
      ).toEqual(["06", "/", "05", "/", "2026"]);
    });

    it("no longer marks a filled segment as a placeholder", () => {
      const { state } = setup({ granularity: "day", value: new CalendarDate(2026, 6, 5) });

      expect(
        state()
          .segments.value.filter((s) => s.isEditable)
          .some((s) => s.isPlaceholder),
      ).toBe(false);
    });

    it("shows an era for a Gregorian year before AD 1", () => {
      // Without it the field would read as the same year AD, which is a different date entirely.
      const { texts, types } = setup({
        granularity: "day",
        value: new CalendarDate("BC", 44, 3, 15),
      });

      expect(types()).toContain("era");
      expect(texts()).toEqual(["3", "/", "15", "/", "44", " ", "BC"]);
    });
  });

  describe("stepping a segment", () => {
    it("lands on the placeholder on the first press", () => {
      // The first arrow press on an empty field selects the placeholder date rather than the day
      // after it.
      const { state, texts } = setup({
        granularity: "day",
        placeholderValue: new CalendarDate(2030, 3, 9),
      });

      state().increment("day");
      expect(texts()).toEqual(["mm", "/", "9", "/", "yyyy"]);
    });

    it("steps from there on later presses", async () => {
      const { state, texts } = setup({
        granularity: "day",
        placeholderValue: new CalendarDate(2030, 3, 9),
      });

      state().increment("day");
      await nextTick();
      state().increment("day");
      expect(texts()).toEqual(["mm", "/", "10", "/", "yyyy"]);
    });

    it("pages a day by a week", () => {
      // Seeded, because the first press on an empty field lands on the placeholder whatever the
      // amount — paging only shows itself once a segment has a value to move.
      const { state, texts } = setup({
        defaultValue: new CalendarDate(2026, 6, 5),
        granularity: "day",
      });

      state().incrementPage("day");
      expect(texts()).toEqual(["6", "/", "12", "/", "2026"]);
    });

    it("rounds a paged month and year to a multiple of the step", () => {
      // Paging snaps rather than adds, the same way minutes do: June paged by two reaches August
      // (a multiple of 2), and 2026 paged by five reaches 2030 rather than 2031.
      const month = setup({ defaultValue: new CalendarDate(2026, 6, 5), granularity: "day" });

      month.state().incrementPage("month");
      expect(month.texts()[0]).toBe("8");

      const year = setup({ defaultValue: new CalendarDate(2026, 6, 5), granularity: "day" });

      year.state().incrementPage("year");
      expect(year.texts()[4]).toBe("2030");
    });

    it("leaves a controlled value where its owner put it", () => {
      // The owner decides. The field reports the edit and shows nothing new until told to.
      const onChange = vi.fn();
      const { state, texts } = setup({
        granularity: "day",
        onChange,
        value: new CalendarDate(2026, 6, 5),
      });

      state().increment("day");

      expect(texts()).toEqual(["6", "/", "5", "/", "2026"]);
      expect(onChange.mock.calls[0]?.[0]?.toString()).toBe("2026-06-06");
    });

    it("refuses to change a read-only field", () => {
      const { state, texts } = setup({
        granularity: "day",
        isReadOnly: true,
        value: new CalendarDate(2026, 6, 5),
      });

      state().increment("day");
      expect(texts()).toEqual(["6", "/", "5", "/", "2026"]);
    });

    it("refuses to change a disabled field", () => {
      const { state, texts } = setup({
        granularity: "day",
        isDisabled: true,
        value: new CalendarDate(2026, 6, 5),
      });

      state().increment("day");
      expect(texts()).toEqual(["6", "/", "5", "/", "2026"]);
    });
  });

  describe("emitting a value", () => {
    it("says nothing until every segment is filled", async () => {
      const onChange = vi.fn();
      const { state } = setup({ granularity: "day", onChange });

      state().setSegment("year", 2027);
      await nextTick();
      state().setSegment("month", 3);
      await nextTick();

      // Two thirds of a date is not a date, so the owner has heard nothing yet.
      expect(onChange).not.toHaveBeenCalled();

      state().setSegment("day", 9);
      await nextTick();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]?.toString()).toBe("2027-03-09");
    });

    it("holds back a complete date that does not exist", async () => {
      const onChange = vi.fn();
      const { state, texts } = setup({ granularity: "day", onChange });

      state().setSegment("year", 2026);
      await nextTick();
      state().setSegment("month", 2);
      await nextTick();
      state().setSegment("day", 30);
      await nextTick();

      // February 30 is complete but not real. It stays on screen so the user can keep typing,
      // and the owner is not told about a date that does not exist.
      expect(texts()).toEqual(["2", "/", "30", "/", "2026"]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("settles that date when the field is left", async () => {
      const onChange = vi.fn();
      const { state } = setup({ granularity: "day", onChange });

      state().setSegment("year", 2026);
      await nextTick();
      state().setSegment("month", 2);
      await nextTick();
      state().setSegment("day", 30);
      await nextTick();

      state().confirmPlaceholder();
      await nextTick();

      // Constrained to the end of the month, which is where leaving the field resolves it.
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]?.[0]?.toString()).toBe("2026-02-28");
    });

    it("says nothing when one segment of a date is cleared", async () => {
      // Two thirds of a date is not a date and not nothing either, so the owner keeps what it has
      // while the field waits for the segment to be filled again.
      const onChange = vi.fn();
      const { state } = setup({
        defaultValue: new CalendarDate(2026, 6, 5),
        granularity: "day",
        onChange,
      });

      state().clearSegment("day");
      await nextTick();

      expect(onChange).not.toHaveBeenCalled();
    });

    it("reports no value once every segment is cleared", async () => {
      const onChange = vi.fn();
      const { state } = setup({
        defaultValue: new CalendarDate(2026, 6, 5),
        granularity: "day",
        onChange,
      });

      state().clearSegment("day");
      await nextTick();
      state().clearSegment("month");
      await nextTick();
      state().clearSegment("year");
      await nextTick();

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("a validation state owned by the picker above", () => {
    it("reports through it instead of judging the value itself", () => {
      // A picker holds the value and the bounds, so its verdict is the only one that can be right.
      // Without this the field would reach a second, disagreeing answer about the same date.
      const owner = setup({
        granularity: "day",
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
        value: new CalendarDate(2026, 1, 1),
      });
      const borrowed = setup({ granularity: "day", validationState: owner.state() });

      expect(borrowed.state().isInvalid.value).toBe(true);
      expect(borrowed.state().displayValidation.value.validationErrors).toEqual([
        "Value must be 6/1/2026 or later.",
      ]);
    });

    it("keeps its own bounds out of the borrowed verdict", () => {
      const owner = setup({ granularity: "day", validationBehavior: "aria" });
      const borrowed = setup({
        granularity: "day",
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
        validationState: owner.state(),
        value: new CalendarDate(2026, 1, 1),
      });

      expect(borrowed.state().isInvalid.value).toBe(false);
    });
  });

  describe("validation", () => {
    it("reports the message a custom validator returns", () => {
      // The validator is resolved through `toValue`, so handing it over bare gets it *called* with
      // no argument, and a message returned that way is then invoked as if it were a function.
      const { state } = setup({
        granularity: "day",
        validate: (value: DateValue | null) => (value && value.day > 15 ? "too late" : null),
        validationBehavior: "aria",
        value: new CalendarDate(2026, 6, 20),
      });

      expect(state().displayValidation.value.validationErrors).toEqual(["too late"]);
      expect(state().isInvalid.value).toBe(true);
    });

    it("hands a custom validator the value it is judging", () => {
      const validate = vi.fn().mockReturnValue(null);
      const { state } = setup({
        granularity: "day",
        validate,
        validationBehavior: "aria",
        value: new CalendarDate(2026, 6, 20),
      });

      // Reading the result is what runs the validator — nothing is validated until it is asked for.
      expect(state().displayValidation.value.validationErrors).toEqual([]);
      expect(String(validate.mock.calls[0]?.[0])).toBe("2026-06-20");
    });

    it("reports a date below the minimum", () => {
      const { state } = setup({
        granularity: "day",
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "aria",
        value: new CalendarDate(2026, 1, 1),
      });

      expect(state().isInvalid.value).toBe(true);
      expect(state().displayValidation.value.validationErrors).toEqual([
        "Value must be 6/1/2026 or later.",
      ]);
      expect(state().displayValidation.value.validationDetails.rangeUnderflow).toBe(true);
    });

    it("reports a date the caller has ruled out", () => {
      const { state } = setup({
        granularity: "day",
        isDateUnavailable: (date: CalendarDate) => date.day === 6,
        validationBehavior: "aria",
        value: new CalendarDate(2026, 6, 6),
      });

      expect(state().displayValidation.value.validationErrors).toEqual([
        "Selected date unavailable.",
      ]);
      // Reported as bad input rather than a range problem: the date is inside the range, the
      // range simply has a hole in it.
      expect(state().displayValidation.value.validationDetails.badInput).toBe(true);
    });

    it("holds a range error back until commit under native behaviour", () => {
      // There is no native constraint for a date range, so nothing shows it until the form asks —
      // which is what `validationBehavior: "native"` means, and what the components default to.
      const { state } = setup({
        granularity: "day",
        minValue: new CalendarDate(2026, 6, 1),
        validationBehavior: "native",
        value: new CalendarDate(2026, 1, 1),
      });

      expect(state().isInvalid.value).toBe(false);
      expect(state().realtimeValidation.value.isInvalid).toBe(true);
    });
  });

  describe("granularity", () => {
    it("takes a time granularity from a value that carries a time", () => {
      const { state } = setup({ value: new CalendarDateTime(2026, 6, 5, 13, 45) });

      expect(state().granularity.value).toBe("minute");
    });

    it("keeps the time segments after the value is cleared", async () => {
      // Emptying a date-and-time field must not collapse it into a date-only one.
      const props = reactive({ value: new CalendarDateTime(2026, 6, 5, 13, 45) as unknown });
      const { state, types } = setup(props);

      expect(state().granularity.value).toBe("minute");

      props.value = null;
      await nextTick();

      expect(state().granularity.value).toBe("minute");
      expect(types()).toContain("minute");
    });

    it("refuses a granularity the value cannot carry", () => {
      // A plain date has no minutes, so asking for minute precision is a caller error rather
      // than something to silently round.
      // Read rather than merely mounted: a Vue computed is lazy, so the error surfaces on first
      // access rather than during render the way React's hook raises it.
      const { state } = setup({ granularity: "minute", value: new CalendarDate(2026, 6, 5) });

      expect(() => state().granularity.value).toThrow(/Invalid granularity/);
    });
  });

  describe("calendar systems", () => {
    it("displays in the calendar the locale names", () => {
      const { state } = setup({ granularity: "day", locale: "th-TH-u-ca-buddhist" });

      expect(state().calendar.value.identifier).toBe("buddhist");
    });

    it("emits in the calendar the value arrived in", async () => {
      // The calendar a field displays in is a display concern; the owner gets back what it gave.
      const onChange = vi.fn();
      const { state } = setup({
        granularity: "day",
        locale: "th-TH-u-ca-buddhist",
        onChange,
        value: new CalendarDate(2026, 6, 5),
      });

      state().increment("day");
      await nextTick();

      expect(onChange.mock.calls[0]?.[0]?.calendar.identifier).toBe("gregory");
    });

    it("builds calendars through the injected factory", () => {
      const factory = vi.fn(createCalendar);
      const { state } = setup({ createCalendar: factory, granularity: "day" });

      // Read for the same reason: nothing asks for the calendar until a segment is rendered.
      expect(state().calendar.value.identifier).toBe("gregory");
      expect(factory).toHaveBeenCalled();
    });
  });
});
