import {
  CalendarDate,
  HebrewCalendar,
  JapaneseCalendar,
  createCalendar,
} from "@internationalized/date";
import { describe, expect, it } from "vitest";

import {
  alignCenter,
  alignEnd,
  alignStart,
  constrainStart,
  constrainValue,
  getDayViewGridRows,
  getDayViewWeekDayLabels,
  getGregorianYearOffset,
  getYearRange,
  isDateInvalid,
  isEqualDuration,
  previousAvailableDate,
} from "@/utils/calendar";

/*
 * Every expectation here was read off react-stately's `calendar/utils.ts` run over the same
 * inputs, rather than worked out by hand. Calendar arithmetic across systems is exactly where a
 * hand-derived expectation quietly bakes in the bug it was supposed to catch.
 */

const date = (year: number, month: number, day: number) => new CalendarDate(year, month, day);

describe("isDateInvalid", () => {
  it("accepts a date inside the range", () => {
    expect(isDateInvalid(date(2024, 6, 15), date(2024, 1, 1), date(2024, 12, 31))).toBe(false);
  });

  it("rejects a date under the minimum", () => {
    expect(isDateInvalid(date(2023, 12, 31), date(2024, 1, 1), null)).toBe(true);
  });

  it("rejects a date over the maximum", () => {
    expect(isDateInvalid(date(2025, 1, 1), null, date(2024, 12, 31))).toBe(true);
  });

  it("accepts anything when neither bound is given", () => {
    expect(isDateInvalid(date(1, 1, 1), null, undefined)).toBe(false);
  });

  it("treats the bounds themselves as valid", () => {
    const min = date(2024, 3, 10);
    const max = date(2024, 6, 20);

    expect(isDateInvalid(min, min, max)).toBe(false);
    expect(isDateInvalid(max, min, max)).toBe(false);
  });
});

describe("alignStart", () => {
  it("puts a month range on the first of the month", () => {
    expect(alignStart(date(2024, 6, 15), { months: 1 }, "en-US").toString()).toBe("2024-06-01");
  });

  it("puts a year range on the first day of the year", () => {
    expect(alignStart(date(2024, 6, 15), { years: 2 }, "en-US").toString()).toBe("2024-01-01");
  });

  it("puts a week range on the locale's first day of the week", () => {
    // The same date lands on a different day in each locale, which is the whole reason the locale
    // reaches this function at all.
    expect(alignStart(date(2024, 6, 15), { weeks: 1 }, "en-US").toString()).toBe("2024-06-09");
    expect(alignStart(date(2024, 6, 15), { weeks: 1 }, "de-DE").toString()).toBe("2024-06-10");
  });

  it("leaves a short day range where it is", () => {
    // Fewer than eight days is not week-shaped, so there is no boundary to snap to.
    expect(alignStart(date(2024, 6, 15), { days: 7 }, "en-US").toString()).toBe("2024-06-15");
  });

  it("snaps a day range longer than a week to the week boundary", () => {
    expect(alignStart(date(2024, 6, 15), { days: 10 }, "en-US").toString()).toBe("2024-06-09");
  });

  it("clamps forward to the minimum's own aligned start", () => {
    expect(
      alignStart(date(2024, 6, 15), { months: 1 }, "en-US", date(2024, 7, 1), null).toString(),
    ).toBe("2024-06-01");
    expect(
      alignStart(date(2024, 6, 15), { months: 1 }, "en-US", date(2024, 3, 10), null).toString(),
    ).toBe("2024-06-01");
  });

  it("clamps back so a multi-month range never runs past the maximum", () => {
    expect(
      alignStart(date(2024, 6, 15), { months: 3 }, "en-US", null, date(2024, 6, 20)).toString(),
    ).toBe("2024-04-01");
  });
});

describe("alignEnd", () => {
  it("ends a month range on the month holding the date", () => {
    expect(alignEnd(date(2024, 6, 15), { months: 3 }, "en-US").toString()).toBe("2024-04-01");
  });

  it("ends a single month on that month", () => {
    expect(alignEnd(date(2024, 6, 15), { months: 1 }, "en-US").toString()).toBe("2024-06-01");
  });

  it("ends a day range on the date itself", () => {
    expect(alignEnd(date(2024, 6, 15), { days: 3 }, "en-US").toString()).toBe("2024-06-13");
  });

  it("ends a week range on the week holding the date", () => {
    expect(alignEnd(date(2024, 6, 15), { weeks: 2 }, "en-US").toString()).toBe("2024-06-02");
  });
});

describe("alignCenter", () => {
  it("centres an odd span on the date", () => {
    expect(alignCenter(date(2024, 6, 15), { months: 3 }, "en-US").toString()).toBe("2024-05-01");
  });

  it("biases an even span towards the earlier half", () => {
    // Two months put the focused one first, not second: `{months: 2}` halves to 1 and then the
    // even-span decrement takes it back to 0. Dropping that decrement is what makes a two-month
    // calendar open on the month *before* the one asked for.
    expect(alignCenter(date(2024, 6, 15), { months: 2 }, "en-US").toString()).toBe("2024-06-01");
    expect(alignCenter(date(2024, 6, 15), { months: 4 }, "en-US").toString()).toBe("2024-05-01");
  });

  it("leaves a single unit alone", () => {
    expect(alignCenter(date(2024, 6, 15), { months: 1 }, "en-US").toString()).toBe("2024-06-01");
  });

  it("respects the bounds while centring", () => {
    expect(
      alignCenter(date(2024, 6, 15), { months: 3 }, "en-US", date(2024, 6, 1), null).toString(),
    ).toBe("2024-06-01");
  });
});

describe("constrainStart", () => {
  it("leaves an aligned start inside the bounds untouched", () => {
    const aligned = date(2024, 6, 1);

    expect(
      constrainStart(date(2024, 6, 15), aligned, { months: 1 }, "en-US", null, null).toString(),
    ).toBe("2024-06-01");
  });

  it("only clamps on the side the date itself is inside", () => {
    // The date is past the maximum, so the maximum must not drag the visible page backwards —
    // otherwise the calendar would jump away from what the user is looking at.
    const aligned = date(2024, 8, 1);

    expect(
      constrainStart(
        date(2024, 8, 15),
        aligned,
        { months: 1 },
        "en-US",
        null,
        date(2024, 6, 20),
      ).toString(),
    ).toBe("2024-08-01");
  });
});

describe("constrainValue", () => {
  it("lifts a date up to the minimum", () => {
    expect(constrainValue(date(2020, 1, 1), date(2024, 3, 10), null).toString()).toBe("2024-03-10");
  });

  it("pulls a date down to the maximum", () => {
    expect(constrainValue(date(2030, 1, 1), null, date(2024, 6, 20)).toString()).toBe("2024-06-20");
  });

  it("leaves a date inside the range alone", () => {
    expect(constrainValue(date(2024, 5, 5), date(2024, 1, 1), date(2024, 12, 31)).toString()).toBe(
      "2024-05-05",
    );
  });

  it("keeps a clamping bound in the calendar the bound was written in", () => {
    // The bound is returned as-is rather than converted, so the clamped value can come back in a
    // different calendar system than the date that went in. Callers that care re-convert.
    const min = new CalendarDate(new HebrewCalendar(), 5784, 1, 1);
    const constrained = constrainValue(date(2020, 1, 1), min, null);

    expect(constrained.calendar.identifier).toBe("hebrew");
    expect(constrained.toString()).toBe("2023-09-16");
  });
});

describe("previousAvailableDate", () => {
  it("returns the date itself when nothing is unavailable", () => {
    const from = date(2024, 6, 15);

    expect(previousAvailableDate(from, date(2024, 1, 1))).toBe(from);
  });

  it("walks back to the nearest available day", () => {
    const isDateUnavailable = (value: CalendarDate) => value.day > 12;

    expect(
      previousAvailableDate(date(2024, 6, 15), date(2024, 1, 1), isDateUnavailable)?.toString(),
    ).toBe("2024-06-12");
  });

  it("returns null when the whole stretch down to the minimum is unavailable", () => {
    // The caller has to be able to tell "nothing to select" apart from "select the boundary" —
    // returning the minimum here would select a day the calendar said was unavailable.
    expect(previousAvailableDate(date(2024, 6, 15), date(2024, 6, 10), () => true)).toBeNull();
  });

  it("stops exactly at the minimum when the minimum is available", () => {
    expect(
      previousAvailableDate(
        date(2024, 6, 15),
        date(2024, 6, 10),
        (value) => value.day > 10,
      )?.toString(),
    ).toBe("2024-06-10");
  });
});

describe("isEqualDuration", () => {
  it("matches the same object", () => {
    const duration = { months: 1 };

    expect(isEqualDuration(duration, duration)).toBe(true);
  });

  it("matches equal-but-separate durations", () => {
    expect(isEqualDuration({ months: 1 }, { months: 1 })).toBe(true);
  });

  it("separates different units of the same size", () => {
    expect(isEqualDuration({ months: 1 }, { weeks: 1 })).toBe(false);
  });

  it("separates different sizes of the same unit", () => {
    expect(isEqualDuration({ months: 1 }, { months: 2 })).toBe(false);
  });
});

describe("getGregorianYearOffset", () => {
  it.each([
    ["buddhist", 543],
    ["ethiopic", -8],
    ["ethioaa", -8],
    ["coptic", -284],
    ["hebrew", 3760],
    ["indian", -78],
    ["islamic-civil", -579],
    ["islamic-tbla", -579],
    ["islamic-umalqura", -579],
    ["persian", -600],
    ["roc", 0],
    ["japanese", 0],
    ["gregory", 0],
  ])("offsets %s by %i", (identifier, offset) => {
    expect(getGregorianYearOffset(identifier)).toBe(offset);
  });

  it("falls back to no offset for a calendar it does not know", () => {
    expect(getGregorianYearOffset("something-else")).toBe(0);
  });

  it("lands on a real date when used to build the default bounds", () => {
    // This is the only thing the offset is for: 1900 Gregorian has to be expressible in the
    // target calendar's own year numbering, or the default bounds throw.
    for (const identifier of ["buddhist", "hebrew", "indian", "persian", "roc"] as const) {
      const calendar = createCalendar(identifier);
      const offset = getGregorianYearOffset(identifier);

      expect(new CalendarDate(calendar, 1900 + offset, 1, 1).era).toBeTruthy();
    }
  });
});

describe("getYearRange", () => {
  it("returns every year start inclusive of both ends", () => {
    expect(getYearRange(date(2020, 6, 15), date(2023, 2, 1)).map(String)).toEqual([
      "2020-01-01",
      "2021-01-01",
      "2022-01-01",
      "2023-01-01",
    ]);
  });

  it("returns a single year when both ends sit in it", () => {
    expect(getYearRange(date(2024, 1, 5), date(2024, 12, 31)).map(String)).toEqual(["2024-01-01"]);
  });

  it("returns nothing when either end is missing", () => {
    expect(getYearRange(null, date(2024, 1, 1))).toEqual([]);
    expect(getYearRange(date(2024, 1, 1), undefined)).toEqual([]);
  });

  it("steps in the calendar's own years rather than counting integers", () => {
    // A Japanese year can end mid-Gregorian-year at an era change, so stepping has to go through
    // the calendar. 1989 is the Shōwa/Heisei boundary.
    const calendar = new JapaneseCalendar();
    const years = getYearRange(
      new CalendarDate(calendar, "showa", 63, 1, 1),
      new CalendarDate(calendar, "heisei", 2, 12, 31),
    );

    expect(years.map((year) => `${year.era}-${year.year}`)).toEqual([
      "showa-63",
      "showa-64",
      "heisei-2",
    ]);
  });
});

describe("getDayViewWeekDayLabels", () => {
  it("starts the week where the locale starts it", () => {
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", undefined)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "de-DE", undefined)).toEqual([
      "Mo",
      "Di",
      "Mi",
      "Do",
      "Fr",
      "Sa",
      "So",
    ]);
  });

  it("honours an explicit first day of the week over the locale's", () => {
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", "wed")[0]).toBe("Wed");
  });

  it("writes the names in the requested width", () => {
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", "sun", "narrow")).toEqual([
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
      "S",
    ]);
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", "sun", "long")[0]).toBe("Sunday");
  });

  it("reads the names in the given time zone", () => {
    // Formatting a UTC midnight in Tokyo would otherwise slide every name on by a day.
    expect(
      getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", "sun", "short", "Asia/Tokyo"),
    ).toEqual(getDayViewWeekDayLabels(date(2024, 6, 15), "en-US", "sun", "short", "UTC"));
  });

  it("always returns seven labels", () => {
    expect(getDayViewWeekDayLabels(date(2024, 6, 15), "ar-AE", "sat")).toHaveLength(7);
  });
});

describe("getDayViewGridRows", () => {
  it("starts the first row on the week boundary, not on the range start", () => {
    // The leading days are rendered so the grid lines up under the weekday names; the calendar
    // marks them outside the visible range rather than omitting them.
    const rows = getDayViewGridRows(date(2024, 6, 12), date(2024, 6, 18), "en-US");

    expect(rows).toHaveLength(2);
    expect(rows[0]?.map(String)).toEqual([
      "2024-06-09",
      "2024-06-10",
      "2024-06-11",
      "2024-06-12",
      "2024-06-13",
      "2024-06-14",
      "2024-06-15",
    ]);
  });

  it("pads the tail of the last row with nulls past the end", () => {
    const rows = getDayViewGridRows(date(2024, 6, 12), date(2024, 6, 18), "en-US");

    expect(rows[1]?.map((value) => (value ? String(value) : null))).toEqual([
      "2024-06-16",
      "2024-06-17",
      "2024-06-18",
      null,
      null,
      null,
      null,
    ]);
  });

  it("returns a single row for a range inside one week", () => {
    expect(getDayViewGridRows(date(2024, 6, 10), date(2024, 6, 12), "en-US")).toHaveLength(1);
  });

  it("follows the locale's week boundary", () => {
    const [first] = getDayViewGridRows(date(2024, 6, 12), date(2024, 6, 18), "de-DE");

    expect(String(first?.[0])).toBe("2024-06-10");
  });

  it("follows an explicit first day of the week", () => {
    const [first] = getDayViewGridRows(date(2024, 6, 12), date(2024, 6, 18), "en-US", "wed");

    expect(String(first?.[0])).toBe("2024-06-12");
  });

  it("covers a range spanning several weeks", () => {
    // June 2024 starts on a Saturday, so the first week contributes a row of its own and the
    // month spills into a sixth.
    const rows = getDayViewGridRows(date(2024, 6, 1), date(2024, 6, 30), "en-US");

    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.length === 7)).toBe(true);
  });
});
