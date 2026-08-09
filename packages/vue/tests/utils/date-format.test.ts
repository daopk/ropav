import {
  CalendarDate,
  CalendarDateTime,
  Time,
  ZonedDateTime,
  createCalendar,
} from "@internationalized/date";
import {describe, expect, it} from "vitest";

import {
  convertValue,
  createPlaceholderDate,
  getFormatOptions,
  getPlaceholderTime,
} from "@/utils/date-format";

/** The keys that name a segment, in the order they appear — the rest is timezone/era plumbing. */
const segments = (options: Intl.DateTimeFormatOptions) =>
  Object.keys(options).filter(
    (key) => key !== "timeZone" && key !== "timeZoneName" && key !== "hour12" && key !== "era",
  );

describe("getFormatOptions", () => {
  describe("which segments a field gets", () => {
    it("spans from the coarsest segment to the granularity", () => {
      // This is the whole point of the function: the segment list is the slice between the two
      // granularities, so this is what decides a date field's shape.
      expect(segments(getFormatOptions({}, {granularity: "day"}))).toEqual([
        "year",
        "month",
        "day",
      ]);
      expect(segments(getFormatOptions({}, {granularity: "minute"}))).toEqual([
        "year",
        "month",
        "day",
        "hour",
        "minute",
      ]);
      expect(segments(getFormatOptions({}, {granularity: "second"}))).toEqual([
        "year",
        "month",
        "day",
        "hour",
        "minute",
        "second",
      ]);
    });

    it("defaults to minute when no granularity is given", () => {
      expect(segments(getFormatOptions({}, {}))).toEqual([
        "year",
        "month",
        "day",
        "hour",
        "minute",
      ]);
    });

    it("starts where maxGranularity says", () => {
      expect(segments(getFormatOptions({}, {granularity: "day", maxGranularity: "month"}))).toEqual(
        ["month", "day"],
      );
      expect(
        segments(getFormatOptions({}, {granularity: "minute", maxGranularity: "hour"})),
      ).toEqual(["hour", "minute"]);
    });

    it("gives a time field only its time segments", () => {
      // A time field is a date field whose window starts at the hour — there is no separate
      // machinery for it.
      expect(
        segments(getFormatOptions({}, {granularity: "minute", maxGranularity: "hour"})),
      ).toEqual(["hour", "minute"]);
    });

    it("refuses a window that runs backwards", () => {
      expect(() => getFormatOptions({}, {granularity: "day", maxGranularity: "minute"})).toThrow(
        "maxGranularity must be greater than granularity",
      );
    });

    it("falls back to the day slot for a granularity it does not know", () => {
      // Upstream does not throw here, so neither does this: an unrecognised granularity still has
      // to produce a usable field.
      expect(segments(getFormatOptions({}, {granularity: "fortnight" as never}))).toEqual([
        "year",
        "month",
        "day",
      ]);
    });
  });

  describe("how each segment is written", () => {
    it("uses single-digit defaults", () => {
      const options = getFormatOptions({}, {granularity: "day"});

      expect(options.month).toBe("numeric");
      expect(options.day).toBe("numeric");
    });

    it("pads month and day when leading zeros are forced", () => {
      const options = getFormatOptions({}, {granularity: "day", shouldForceLeadingZeros: true});

      expect(options.month).toBe("2-digit");
      expect(options.day).toBe("2-digit");
      // The year is never padded, in either table.
      expect(options.year).toBe("numeric");
    });

    it("lets the caller override one segment's style", () => {
      expect(getFormatOptions({month: "long"}, {granularity: "day"}).month).toBe("long");
    });
  });

  describe("time zone and era", () => {
    it("defaults to UTC when no zone is given", () => {
      expect(getFormatOptions({}, {granularity: "day"}).timeZone).toBe("UTC");
    });

    it("names the zone only when the field shows a time", () => {
      expect(
        getFormatOptions({}, {granularity: "minute", timeZone: "America/New_York"}).timeZoneName,
      ).toBe("short");
      // A date-only field has no time for a zone to qualify.
      expect(
        getFormatOptions({}, {granularity: "day", timeZone: "America/New_York"}).timeZoneName,
      ).toBeUndefined();
    });

    it("hides the zone name on request", () => {
      expect(
        getFormatOptions(
          {},
          {granularity: "minute", hideTimeZone: true, timeZone: "America/New_York"},
        ).timeZoneName,
      ).toBeUndefined();
    });

    it("shows an era only for a field that starts at the year", () => {
      expect(getFormatOptions({}, {granularity: "day", showEra: true}).era).toBe("short");
      // An era belongs beside a year; a field starting at the month has nothing to qualify.
      expect(
        getFormatOptions({}, {granularity: "day", maxGranularity: "month", showEra: true}).era,
      ).toBeUndefined();
    });

    it("turns the hour cycle into hour12", () => {
      expect(getFormatOptions({}, {granularity: "hour", hourCycle: 12}).hour12).toBe(true);
      expect(getFormatOptions({}, {granularity: "hour", hourCycle: 24}).hour12).toBe(false);
      expect(getFormatOptions({}, {granularity: "hour"}).hour12).toBeUndefined();
    });
  });
});

describe("getPlaceholderTime", () => {
  it("keeps a placeholder that already carries a time", () => {
    const value = new CalendarDateTime(2026, 6, 5, 13, 45, 30);

    expect(getPlaceholderTime(value)).toBe(value);
  });

  it("falls back to midnight for a date with no time", () => {
    expect(getPlaceholderTime(new CalendarDate(2026, 6, 5))).toEqual(new Time());
  });

  it("falls back to midnight for no placeholder at all", () => {
    expect(getPlaceholderTime(undefined)).toEqual(new Time());
    expect(getPlaceholderTime(null)).toEqual(new Time());
  });
});

describe("convertValue", () => {
  it("re-expresses a date in another calendar system", () => {
    const buddhist = convertValue(new CalendarDate(2026, 6, 5), createCalendar("buddhist"))!;

    // 2026 CE is 2569 BE — the same instant told in another calendar, not a different date.
    expect(buddhist.calendar.identifier).toBe("buddhist");
    expect(buddhist.year).toBe(2569);
  });

  it("keeps null and undefined apart", () => {
    // The caller distinguishes "explicitly cleared" from "never set", so this has to survive.
    expect(convertValue(null, createCalendar("gregory"))).toBeNull();
    expect(convertValue(undefined, createCalendar("gregory"))).toBeUndefined();
  });
});

describe("createPlaceholderDate", () => {
  const gregory = createCalendar("gregory");

  // Asserted with `instanceof` rather than `constructor.name`: the published
  // `@internationalized/date` bundle mangles its class names, so the name is a build artifact.

  it("uses the given placeholder, converted", () => {
    const date = createPlaceholderDate(
      new CalendarDate(2026, 6, 5),
      "day",
      createCalendar("buddhist"),
      undefined,
    );

    expect(date.year).toBe(2569);
  });

  it("trims to a plain date for a date-only granularity", () => {
    for (const granularity of ["year", "month", "day"]) {
      const date = createPlaceholderDate(undefined, granularity, gregory, undefined);

      expect(date).toBeInstanceOf(CalendarDate);
    }
  });

  it("keeps a time for a time-bearing granularity", () => {
    const date = createPlaceholderDate(undefined, "minute", gregory, undefined);

    expect(date).toBeInstanceOf(CalendarDateTime);
    // Midnight, so an untouched field does not start at whatever time the page loaded.
    expect(date).toMatchObject({hour: 0, minute: 0, second: 0});
  });

  it("stays zoned when a time zone is given", () => {
    const date = createPlaceholderDate(undefined, "minute", gregory, "America/New_York");

    expect(date).toBeInstanceOf(ZonedDateTime);
  });
});
