import type {TimeFieldState} from "@/composables/use-time-field-state";
import type {TimeValue} from "@/utils/date-format";
import type {DateSegmentType} from "@/utils/incomplete-date";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {CalendarDateTime, Time, ZonedDateTime} from "@internationalized/date";
import {describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import Host from "../fixtures/time-field-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let state!: TimeFieldState;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: TimeFieldState) => (state = value),
  });

  const result = renderVapor(Host, {props});

  return {
    ...result,
    /** Which segments the user can actually edit, with separators and bidi marks dropped. */
    editable: () =>
      state.segments.value.filter((segment) => segment.isEditable).map((segment) => segment.type),
    state: () => state,
    text: (type: DateSegmentType) =>
      state.segments.value.find((segment) => segment.type === type)?.text,
    types: () => state.segments.value.map((segment) => segment.type),
  };
};

/** A time field mounted with a recorder on `onChange`. */
const setupWithChanges = (props: Record<string, unknown> = {}) => {
  const emitted: (string | null)[] = [];
  const field = setup({
    ...props,
    onChange: (value: TimeValue | null) => emitted.push(value?.toString() ?? null),
  });

  return {...field, emitted};
};

const NEW_YORK_AFTERNOON = new ZonedDateTime(2026, 6, 5, "America/New_York", -14400000, 13, 45);

describe("useTimeFieldState", () => {
  describe("which segments a field has", () => {
    it("gives a field only its time segments", () => {
      // This is the whole point of a time field: the same machinery as a date field, no date.
      expect(setup().editable()).toEqual(["hour", "minute", "dayPeriod"]);
    });

    it("stops at whatever the granularity asks for", () => {
      expect(setup({granularity: "hour"}).editable()).toEqual(["hour", "dayPeriod"]);
      expect(setup({granularity: "second"}).editable()).toEqual([
        "hour",
        "minute",
        "second",
        "dayPeriod",
      ]);
    });

    it("leaves the period out of a 24-hour locale", () => {
      expect(setup({locale: "de-DE"}).editable()).toEqual(["hour", "minute"]);
    });

    it("follows an explicit hour cycle over the locale's own", () => {
      expect(setup({hourCycle: 24, locale: "en-US"}).editable()).not.toContain("dayPeriod");
      expect(setup({hourCycle: 12, locale: "de-DE"}).editable()).toContain("dayPeriod");
    });

    it("shows the zone a zoned value carries", () => {
      const field = setup({value: NEW_YORK_AFTERNOON});

      expect(field.types()).toContain("timeZoneName");
      expect(field.text("timeZoneName")).toBe("EDT");
    });

    it("hides the zone when asked", () => {
      expect(setup({hideTimeZone: true, value: NEW_YORK_AFTERNOON}).types()).not.toContain(
        "timeZoneName",
      );
    });
  });

  describe("what a field shows", () => {
    it("starts blank", () => {
      const field = setup();

      expect(field.text("hour")).toBe("––");
      expect(field.text("minute")).toBe("––");
    });

    it("fills in from a value", () => {
      const field = setup({value: new Time(13, 45)});

      // A 12-hour locale splits the afternoon between the hour and the period.
      expect(field.text("hour")).toBe("1");
      expect(field.text("minute")).toBe("45");
      expect(field.text("dayPeriod")).toBe("PM");
    });

    it("keeps a 24-hour locale on a 24-hour clock", () => {
      expect(setup({locale: "de-DE", value: new Time(13, 45)}).text("hour")).toBe("13");
    });

    it("pads the numbers when asked", () => {
      const field = setup({shouldForceLeadingZeros: true, value: new Time(3, 5)});

      expect(field.text("hour")).toBe("03");
      expect(field.text("minute")).toBe("05");
    });
  });

  describe("the value it reports", () => {
    it("hands back a plain time", () => {
      expect(
        setup({value: new Time(13, 45)})
          .state()
          .timeValue.value?.toString(),
      ).toBe("13:45:00");
    });

    it("drops the date from a value that came with one", () => {
      expect(
        setup({value: new CalendarDateTime(2026, 6, 5, 13, 45)})
          .state()
          .timeValue.value?.toString(),
      ).toBe("13:45:00");
      expect(setup({value: NEW_YORK_AFTERNOON}).state().timeValue.value?.toString()).toBe(
        "13:45:00",
      );
    });

    it("reports nothing while the field is empty", () => {
      expect(setup().state().timeValue.value).toBeNull();
    });
  });

  describe("editing a segment", () => {
    it("starts an empty hour at the placeholder", async () => {
      const withPlaceholder = setup({placeholderValue: new Time(9)});

      withPlaceholder.state().increment("hour");
      await nextTick();
      expect(withPlaceholder.text("hour")).toBe("9");

      // With no placeholder the field starts at midnight, which a 12-hour clock shows as 12.
      const bare = setup();

      bare.state().increment("hour");
      await nextTick();
      expect(bare.text("hour")).toBe("12");
    });

    it("waits for every segment before it reports anything", async () => {
      const field = setupWithChanges();

      field.state().setSegment("hour", 5);
      await nextTick();

      expect(field.text("hour")).toBe("5");
      expect(field.emitted).toEqual([]);

      field.state().setSegment("minute", 30);
      await nextTick();

      expect(field.emitted).toEqual(["05:30:00"]);
    });

    it("keeps showing a time whose segment was cleared", async () => {
      const field = setupWithChanges();

      field.state().setSegment("hour", 5);
      await nextTick();
      field.state().setSegment("minute", 30);
      await nextTick();
      field.state().clearSegment("minute");
      await nextTick();

      expect(field.text("minute")).toBe("––");
      // Half a time is not a time, so there is nothing new to report — the old value still stands.
      expect(field.emitted).toEqual(["05:30:00"]);
      expect(field.state().timeValue.value?.toString()).toBe("05:30:00");
    });

    it("pages the minute in steps of fifteen", async () => {
      const field = setupWithChanges({defaultValue: new Time(13, 45)});

      field.state().incrementPage("minute");
      await nextTick();

      // 45 plus 15 lands on the hour, and paging a minute never carries into the hour.
      expect(field.emitted).toEqual(["13:00:00"]);
    });

    it("wraps a segment without carrying into the next", async () => {
      const hour = setupWithChanges({defaultValue: new Time(23, 45), locale: "de-DE"});

      hour.state().increment("hour");
      await nextTick();
      expect(hour.emitted).toEqual(["00:45:00"]);

      const minute = setupWithChanges({defaultValue: new Time(9, 0), locale: "de-DE"});

      minute.state().decrement("minute");
      await nextTick();
      expect(minute.emitted).toEqual(["09:59:00"]);
    });

    it("moves a time across noon by its period alone", async () => {
      const morning = setupWithChanges({defaultValue: new Time(9, 30)});

      morning.state().setSegment("dayPeriod", 1);
      await nextTick();
      expect(morning.text("dayPeriod")).toBe("PM");
      expect(morning.emitted).toEqual(["21:30:00"]);

      const evening = setupWithChanges({defaultValue: new Time(21, 30)});

      evening.state().increment("dayPeriod");
      await nextTick();
      expect(evening.emitted).toEqual(["09:30:00"]);
    });

    it("takes the hour to the ends of its own clock", async () => {
      const max = setupWithChanges({defaultValue: new Time(9, 30)});

      max.state().incrementToMax("hour");
      await nextTick();
      // On a 12-hour clock the largest hour shown is 11 and the smallest is 12, which is midnight.
      expect(max.emitted).toEqual(["11:30:00"]);

      const min = setupWithChanges({defaultValue: new Time(9, 30)});

      min.state().decrementToMin("hour");
      await nextTick();
      expect(min.emitted).toEqual(["00:30:00"]);
    });

    it("fills a field that goes down to seconds", async () => {
      const field = setupWithChanges({granularity: "second"});

      field.state().setSegment("hour", 5);
      await nextTick();
      field.state().setSegment("minute", 30);
      await nextTick();
      field.state().setSegment("second", 15);
      await nextTick();

      expect(field.emitted).toEqual(["05:30:15"]);
    });

    it("refuses to change while read only or disabled", async () => {
      for (const guard of ["isReadOnly", "isDisabled"]) {
        const field = setupWithChanges({defaultValue: new Time(9, 30), [guard]: true});

        field.state().increment("hour");
        await nextTick();

        expect(field.text("hour")).toBe("9");
        expect(field.emitted).toEqual([]);
      }
    });
  });

  describe("the date a time travelled as", () => {
    it("stays on a value that came with a date", async () => {
      const field = setupWithChanges({defaultValue: new CalendarDateTime(2026, 6, 5, 13, 45)});

      field.state().increment("hour");
      await nextTick();

      expect(field.emitted).toEqual(["2026-06-05T14:45:00"]);
    });

    it("keeps the zone a zoned value came with", async () => {
      const field = setupWithChanges({defaultValue: NEW_YORK_AFTERNOON});

      field.state().increment("hour");
      await nextTick();

      expect(field.emitted).toEqual(["2026-06-05T14:45:00-04:00[America/New_York]"]);
    });

    it("never appears on a value that arrived without one", async () => {
      const field = setupWithChanges();

      field.state().setSegment("hour", 5);
      await nextTick();
      field.state().setSegment("minute", 30);
      await nextTick();

      // The date only ever existed to carry the time through the date field machinery.
      expect(field.emitted).toEqual(["05:30:00"]);
    });
  });

  describe("validation", () => {
    it("reports a time below the minimum", () => {
      const field = setup({
        minValue: new Time(9),
        validationBehavior: "aria",
        value: new Time(3),
      });

      expect(field.state().displayValidation.value.validationErrors).toEqual([
        "Value must be 9:00 AM or later.",
      ]);
      expect(field.state().displayValidation.value.validationDetails.rangeUnderflow).toBe(true);
    });

    it("reports a time above the maximum", () => {
      const field = setup({
        maxValue: new Time(17),
        validationBehavior: "aria",
        value: new Time(21),
      });

      expect(field.state().displayValidation.value.validationErrors).toEqual([
        "Value must be 5:00 PM or earlier.",
      ]);
      expect(field.state().displayValidation.value.validationDetails.rangeOverflow).toBe(true);
    });

    it("accepts a time inside the range", () => {
      const field = setup({
        maxValue: new Time(17),
        minValue: new Time(9),
        validationBehavior: "aria",
        value: new Time(12),
      });

      expect(field.state().displayValidation.value.validationErrors).toEqual([]);
      expect(field.state().isInvalid.value).toBe(false);
    });

    it("reports the message a custom validator returns", () => {
      // The validator is resolved through `toValue`, so handing it over bare — or handing over the
      // result of calling it — ends with a message being invoked as if it were a function.
      const field = setup({
        validate: () => "not during lunch",
        validationBehavior: "aria",
        value: new Time(12, 30),
      });

      expect(field.state().displayValidation.value.validationErrors).toEqual(["not during lunch"]);
      expect(field.state().isInvalid.value).toBe(true);
    });

    it("hands a custom validator the time, not the date it travelled as", () => {
      const validate = vi.fn().mockReturnValue(null);
      const field = setup({validate, validationBehavior: "aria", value: new Time(13, 45)});

      // Reading the result is what runs the validator — nothing is validated until it is asked for.
      expect(field.state().displayValidation.value.validationErrors).toEqual([]);
      expect(validate.mock.calls[0]?.[0]?.toString()).toBe("13:45:00");
    });
  });
});
