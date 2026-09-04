import type { CalendarState } from "@/composables/use-calendar-state";
import type { UseCalendarYearPickerReturn } from "@/composables/use-calendar-year-picker";
import type { ComputedRef } from "vue";

import { CalendarDate, ZonedDateTime, resetLocalTimeZone } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/calendar-heading-host.vue";

type Ready = {
  heading: ComputedRef<string>;
  state: CalendarState;
  years: UseCalendarYearPickerReturn;
};

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: Ready;

  Object.assign(props, {
    defaultFocusedValue: props["defaultFocusedValue"] ?? new CalendarDate(2026, 6, 15),
    locale: props["locale"] ?? "en-US",
    onReady: (value: Ready) => (ready = value),
  });

  const result = renderVapor(Host, { props });

  return {
    ...result,
    heading: () => ready.heading.value,
    state: () => ready.state,
    /** Just the year numbers on offer. */
    yearNumbers: () => ready.years.items.value.map((item) => item.date.year),

    years: () => ready.years,
  };
};

/** Intl inserts its own spaces around a range dash, which are not the ones a keyboard types. */
const normalizeSpaces = (value: string) => value.replace(/[\u00a0\u2009\u202f]/g, " ");

describe("useCalendarHeading", () => {
  it("names the visible month and year", () => {
    expect(setup().heading()).toBe("June 2026");
  });

  it("follows the visible range as it moves", () => {
    const calendar = setup();

    calendar.state().focusNextPage();
    expect(calendar.heading()).toBe("July 2026");
  });

  it("describes a later grid of a multi-month calendar", () => {
    // The offset is what lets each grid of a multi-month calendar carry its own heading from the
    // one shared state.
    const calendar = setup({ offset: { months: 1 }, visibleDuration: { months: 2 } });

    expect(calendar.heading()).toBe("July 2026");
  });

  it("names both ends of a day or week view", () => {
    expect(normalizeSpaces(setup({ visibleDuration: { weeks: 1 } }).heading())).toBe(
      "June 14 – 20, 2026",
    );
    expect(normalizeSpaces(setup({ visibleDuration: { days: 3 } }).heading())).toBe(
      "June 14 – 16, 2026",
    );
  });

  it("writes the month the requested way", () => {
    expect(setup({ format: { month: "short" } }).heading()).toBe("Jun 2026");
    expect(setup({ format: { month: "numeric", year: "2-digit" } }).heading()).toBe("6/26");
  });

  it("spells the era out for a Gregorian date before AD 1", () => {
    expect(setup({ defaultFocusedValue: new CalendarDate("BC", 44, 3, 15) }).heading()).toBe(
      "March 44 BC",
    );
  });

  it("reduces any requested era to the short form", () => {
    /*
     * Upstream's `||` binds tighter than its `?:`, so asking for a long era gets the short one.
     * Ported as written: a heading that disagreed with React's for the same props would be the
     * worse bug.
     */
    expect(setup({ format: { era: "long" } }).heading()).toBe("June 2026 AD");
  });

  it("follows the locale", () => {
    expect(setup({ locale: "de-DE" }).heading()).toBe("Juni 2026");
    expect(setup({ locale: "th-TH-u-ca-buddhist" }).heading()).toBe("มิถุนายน 2569");
  });
});

describe("useCalendarYearPicker", () => {
  it("offers twenty years centred on the focused one", () => {
    const calendar = setup();

    expect(calendar.yearNumbers()).toHaveLength(20);
    expect(calendar.yearNumbers()[0]).toBe(2016);
    expect(calendar.yearNumbers().at(-1)).toBe(2035);
  });

  it("offers as many years as asked for", () => {
    expect(setup({ visibleYears: 6 }).yearNumbers()).toEqual([2023, 2024, 2025, 2026, 2027, 2028]);
    expect(setup({ visibleYears: 7 }).yearNumbers()).toEqual([
      2023, 2024, 2025, 2026, 2027, 2028, 2029,
    ]);
  });

  it("points at the focused year", () => {
    const calendar = setup({ visibleYears: 6 });

    expect(calendar.years().value.value).toBe(3);
    expect(calendar.yearNumbers()[calendar.years().value.value]).toBe(2026);
  });

  it("slides the window back rather than shrinking it at a bound", () => {
    // A picker that shrank near a bound would offer three years in one place and twenty in
    // another, which reads as a bug rather than as a limit.
    const calendar = setup({ maxValue: new CalendarDate(2028, 1, 1), visibleYears: 6 });

    expect(calendar.yearNumbers()).toEqual([2023, 2024, 2025, 2026, 2027, 2028]);
  });

  it("clamps to both bounds when they are narrower than the window", () => {
    const calendar = setup({
      maxValue: new CalendarDate(2027, 1, 1),
      minValue: new CalendarDate(2025, 1, 1),
      visibleYears: 20,
    });

    expect(calendar.yearNumbers()).toEqual([2025, 2026, 2027]);
  });

  it("names itself after the browser's own word for a year field", () => {
    expect(setup().years().ariaLabel.value).toBe("year");
    expect(setup({ locale: "de-DE" }).years().ariaLabel.value).toBe("Jahr");
  });

  it("writes each year in the locale's calendar system", () => {
    // Buddhist years carry their era, which is exactly why the label is formatted rather than
    // taken from `date.year`.
    expect(
      setup({ locale: "th-TH-u-ca-buddhist", visibleYears: 3 })
        .years()
        .items.value.map((item) => item.formatted),
    ).toEqual(["พ.ศ. 2568", "พ.ศ. 2569", "พ.ศ. 2570"]);
  });

  it("moves the calendar to the year it is handed", async () => {
    const calendar = setup({ visibleYears: 6 });

    calendar.years().onChange(0);
    await nextTick();

    expect(calendar.state().focusedDate.value.year).toBe(2023);
    expect(calendar.heading()).toBe("June 2023");
  });

  it("ignores a null selection", () => {
    const calendar = setup();

    calendar.years().onChange(null);

    expect(calendar.state().focusedDate.value.year).toBe(2026);
  });

  it("identifies a year by its position, not its number", () => {
    // A Japanese year can change era mid-year, so the number alone does not name a date.
    const calendar = setup({ visibleYears: 3 });

    expect(calendar.years().items.value.map((item) => item.id)).toEqual([0, 1, 2]);
  });
});

/**
 * A year label is written by resolving a bare date to a moment and reading the year back off it,
 * which only holds if that moment lands on the day it came from. Zones with a gap are where it
 * would not, and the calendar's own default bounds are what put the window on a December 31: the
 * slide off `maxValue` takes that bound's day of the year, not the focused date's.
 *
 * The zone is pinned on a zoned value rather than on the host, because the state only reads the
 * host's zone through a formatter the library caches for the life of the module.
 */
describe("useCalendarYearPicker across a time zone gap", () => {
  const ORIGINAL_TIME_ZONE = process.env["TZ"];

  const EVERY_YEAR_ONCE = Array.from({ length: 200 }, (_, index) => String(1900 + index));

  /** The bounds a calendar sets for itself, wide enough that the window has to slide to reach them. */
  const labelsIn = (timeZone: string, offset: number) =>
    setup({
      maxValue: new CalendarDate(2099, 12, 31),
      minValue: new CalendarDate(1900, 1, 1),
      value: new ZonedDateTime(2026, 6, 15, timeZone, offset),
      visibleYears: 200,
    })
      .years()
      .items.value.map((item) => item.formatted);

  afterEach(() => {
    vi.useRealTimers();
    process.env["TZ"] = ORIGINAL_TIME_ZONE;
    resetLocalTimeZone();
  });

  it("counts every year where the zone drops a whole day", () => {
    // The Line Islands crossed the date line at the end of 1994, so December 31 never happened
    // there at all and a moment asked for on that day comes back in 1995.
    expect(labelsIn("Pacific/Kiritimati", 14 * 60 * 60 * 1000)).toEqual(EVERY_YEAR_ONCE);
  });

  it("counts every year where the zone drops the end of a day", () => {
    /*
     * Vietnam moved an hour forward at 23:00 on the last day of 1942 and again of 1959. Only a
     * picker built during that missing hour loses those two years to 1943 and 1960, because the
     * conversion the library takes for the host's own zone starts from the current time of day —
     * so the host's zone and the clock are both pinned into it.
     */
    process.env["TZ"] = "Asia/Saigon";
    resetLocalTimeZone();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-05T16:30:00Z"));

    expect(labelsIn("Asia/Saigon", 7 * 60 * 60 * 1000)).toEqual(EVERY_YEAR_ONCE);
  });
});
