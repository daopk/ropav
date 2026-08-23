import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  createCalendar,
} from "@internationalized/date";
import {describe, expect, it} from "vitest";

import {IncompleteDate, fromHourCycle, toHourCycle} from "@/utils/incomplete-date";

const gregory = createCalendar("gregory");

/** No date at all, the state a field is in before anything has been typed. */
const blank = (hourCycle: "h11" | "h12" | "h23" | "h24" = "h23") =>
  new IncompleteDate(gregory, hourCycle, null);

const JANUARY_15 = new CalendarDate(2026, 1, 15);
const JANUARY_15_9_30 = new CalendarDateTime(2026, 1, 15, 9, 30, 0);

describe("toHourCycle", () => {
  it("numbers a 12-hour clock from 12 rather than 0", () => {
    // Midnight reads as "12 AM", so hour 0 has to come out as 12 with the morning period.
    expect(toHourCycle(0, "h12")).toEqual([0, 12]);
    expect(toHourCycle(12, "h12")).toEqual([1, 12]);
    expect(toHourCycle(13, "h12")).toEqual([1, 1]);
    expect(toHourCycle(23, "h12")).toEqual([1, 11]);
  });

  it("numbers a Japanese 12-hour clock from 0", () => {
    expect(toHourCycle(0, "h11")).toEqual([0, 0]);
    expect(toHourCycle(12, "h11")).toEqual([1, 0]);
    expect(toHourCycle(23, "h11")).toEqual([1, 11]);
  });

  it("leaves a 24-hour clock with no day period at all", () => {
    // There is nothing for a period segment to say, so the field does not show one.
    expect(toHourCycle(0, "h23")).toEqual([null, 0]);
    expect(toHourCycle(23, "h23")).toEqual([null, 23]);
  });

  it("numbers h24 from 1 to 24", () => {
    expect(toHourCycle(0, "h24")).toEqual([null, 1]);
    expect(toHourCycle(23, "h24")).toEqual([null, 24]);
  });
});

describe("fromHourCycle", () => {
  it("undoes the 12-hour numbering", () => {
    expect(fromHourCycle(12, 0, "h12")).toBe(0);
    expect(fromHourCycle(12, 1, "h12")).toBe(12);
    expect(fromHourCycle(1, 1, "h12")).toBe(13);
    expect(fromHourCycle(11, 1, "h12")).toBe(23);
  });

  it("ignores the day period on a 24-hour clock", () => {
    // h24 has no period, so one arriving from elsewhere must not shift the hour.
    expect(fromHourCycle(12, 0, "h24")).toBe(11);
    expect(fromHourCycle(12, 1, "h24")).toBe(11);
  });
});

describe("IncompleteDate", () => {
  describe("seeding from a value", () => {
    it("takes each segment from the value", () => {
      const date = new IncompleteDate(gregory, "h23", new CalendarDateTime(2026, 6, 5, 13, 45, 30));

      expect(date).toMatchObject({day: 5, hour: 13, minute: 45, month: 6, second: 30, year: 2026});
    });

    it("converts the hour into the locale's own clock", () => {
      const date = new IncompleteDate(gregory, "h12", new CalendarDateTime(2026, 6, 5, 13, 0, 0));

      expect(date.hour).toBe(1);
      expect(date.dayPeriod).toBe(1);
    });

    it("leaves every segment blank for no value", () => {
      expect(blank()).toMatchObject({day: null, hour: null, month: null, year: null});
    });
  });

  describe("completeness", () => {
    it("reports a field complete only once every shown segment is filled", () => {
      const partial = blank().set("year", 2026, JANUARY_15);

      expect(partial.isComplete(["year"])).toBe(true);
      expect(partial.isComplete(["year", "month", "day"])).toBe(false);
    });

    it("reports a field cleared only while every shown segment is blank", () => {
      expect(blank().isCleared(["year", "month", "day"])).toBe(true);
      expect(blank().set("day", 5, JANUARY_15).isCleared(["year", "month", "day"])).toBe(false);
    });
  });

  describe("stepping a blank segment", () => {
    it("lands on the placeholder rather than stepping past it", () => {
      // The first arrow press on an empty field should select today, not the day after today.
      expect(blank().cycle("day", 1, JANUARY_15, ["day"]).day).toBe(15);
      expect(blank().cycle("month", 1, JANUARY_15, ["month"]).month).toBe(1);
      expect(blank().cycle("day", -1, JANUARY_15, ["day"]).day).toBe(15);
    });
  });

  describe("stepping a filled segment", () => {
    it("wraps a day at the longest month, not at the current one", () => {
      const february = new IncompleteDate(gregory, "h23", new CalendarDate(2026, 2, 28));
      const shown = ["year", "month", "day"] as const;

      // February 29 has to be reachable while typing even in a non-leap year; the value is
      // constrained later, when the field is left.
      expect(february.cycle("day", 1, JANUARY_15, [...shown]).day).toBe(29);
      // And the wrap is at 31, so +5 from 28 comes out at 2 rather than being clamped to 31.
      expect(february.cycle("day", 5, JANUARY_15, [...shown]).day).toBe(2);
    });

    it("snaps a paged minute to a multiple of the step", () => {
      const at7 = new IncompleteDate(gregory, "h23", new CalendarDateTime(2026, 6, 5, 10, 7, 0));

      // Paging a minute field by 15 should reach :15, not :22.
      expect(at7.cycle("minute", 15, JANUARY_15_9_30, ["minute"]).minute).toBe(15);
      expect(at7.cycle("minute", -15, JANUARY_15_9_30, ["minute"]).minute).toBe(0);
      // A single step is a plain step, with no rounding.
      expect(at7.cycle("minute", 1, JANUARY_15_9_30, ["minute"]).minute).toBe(8);
    });

    it("moves the era when a year steps across the start of the calendar", () => {
      const year1 = new IncompleteDate(gregory, "h23", new CalendarDate(1, 1, 1));

      expect(year1.era).toBe("AD");

      const previous = year1.cycle("year", -1, JANUARY_15, ["year", "month", "day"]);

      // Stepping below AD 1 reaches BC 1, not year 0 — which no calendar has.
      expect(previous).toMatchObject({era: "BC", year: 1});
    });

    it("cycles the day period between the two halves of the day", () => {
      const morning = blank("h12").set("dayPeriod", 0, JANUARY_15_9_30);

      expect(morning.cycle("dayPeriod", 1, JANUARY_15_9_30, ["dayPeriod"]).dayPeriod).toBe(1);
      expect(morning.cycle("dayPeriod", -1, JANUARY_15_9_30, ["dayPeriod"]).dayPeriod).toBe(1);
    });
  });

  describe("setting a segment", () => {
    it("chooses a day period alongside an hour that has none", () => {
      // An hour with no period is ambiguous, so one is taken from the placeholder.
      const set = blank("h12").set("hour", 5, new CalendarDateTime(2026, 1, 15, 21, 0));

      expect(set).toMatchObject({dayPeriod: 1, hour: 5});
    });

    it("takes the era alongside a year that has none", () => {
      expect(blank().set("year", 2026, JANUARY_15).era).toBe("AD");
    });
  });

  describe("clearing a segment", () => {
    it("takes the era with the year", () => {
      // A year with no era says nothing, so the two go together.
      const dated = new IncompleteDate(gregory, "h23", new CalendarDate(2026, 6, 5));

      expect(dated.era).toBe("AD");
      expect(dated.clear("year")).toMatchObject({era: null, year: null});
    });

    it("leaves the other segments alone", () => {
      const dated = new IncompleteDate(gregory, "h23", new CalendarDate(2026, 6, 5));

      expect(dated.clear("day")).toMatchObject({day: null, month: 6, year: 2026});
    });
  });

  describe("the stored time zone offset", () => {
    const zoned = () =>
      new IncompleteDate(
        gregory,
        "h23",
        new ZonedDateTime(2026, 11, 1, "America/New_York", -14400000, 1, 30, 0),
      );

    it("is dropped when a date or time field changes", () => {
      // An offset belongs to one instant, so it stops being true as soon as the instant moves.
      expect(zoned().offset).toBe(-14400000);
      expect(zoned().set("minute", 45, JANUARY_15).offset).toBeNull();
      expect(zoned().set("day", 2, JANUARY_15).offset).toBeNull();
      expect(zoned().clear("day").offset).toBeNull();
    });

    it("survives a change of seconds", () => {
      // The one exception upstream makes: seconds cannot move a value across an offset change.
      expect(zoned().set("second", 30, JANUARY_15).offset).toBe(-14400000);
    });
  });

  describe("turning into a real date", () => {
    it("fills every blank segment from the given value", () => {
      const onlyYear = blank().set("year", 2030, JANUARY_15);

      expect(onlyYear.toValue(new CalendarDate(2026, 6, 5)).toString()).toBe("2030-06-05");
    });

    it("reads a chosen day period with no hour as midnight or noon", () => {
      const afternoon = blank("h12").set("dayPeriod", 1, JANUARY_15_9_30);

      expect(afternoon.toValue(new CalendarDateTime(2026, 6, 5, 0, 0)).toString()).toBe(
        "2026-06-05T12:00:00",
      );
    });
  });

  describe("segment limits", () => {
    it("reports the day range across any month", () => {
      const february = new IncompleteDate(gregory, "h23", new CalendarDate(2026, 2, 28));

      expect(february.getSegmentLimits("day")).toEqual({maxValue: 31, minValue: 1, value: 28});
    });

    it("reports the hour range for each clock", () => {
      expect(blank("h12").getSegmentLimits("hour")).toMatchObject({maxValue: 12, minValue: 1});
      expect(blank("h11").getSegmentLimits("hour")).toMatchObject({maxValue: 11, minValue: 0});
      expect(blank("h23").getSegmentLimits("hour")).toMatchObject({maxValue: 23, minValue: 0});
    });

    it("has nothing to say about a literal", () => {
      expect(blank().getSegmentLimits("literal")).toBeUndefined();
    });
  });

  describe("other calendar systems", () => {
    it("takes its month and day ranges from the calendar in use", () => {
      // A Hebrew year may have thirteen months, and a field in that calendar has to let the
      // month segment reach the thirteenth.
      const hebrew = new IncompleteDate(createCalendar("hebrew"), "h23", null);

      expect(hebrew.getSegmentLimits("month")?.maxValue).toBe(13);
      expect(blank().getSegmentLimits("month")?.maxValue).toBe(12);
    });
  });
});
