import type {CalendarState} from "@/composables/use-calendar-state";
import type {CalendarDate as CalendarDateType, DateValue} from "@internationalized/date";

import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/calendar-state-host.vue";

/**
 * Mount the host and hand back the live state.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the composable.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let state!: CalendarState;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: CalendarState) => (state = value),
  });

  const result = renderVapor(Host, {props});

  return {
    ...result,

    /** Every date in the grid, row by row, with `null` where the row runs out. */
    grid: () => {
      const rows: (string | null)[][] = [];

      for (let week = 0; week < state.getWeeksInMonth(); week++) {
        rows.push(state.getDatesInWeek(week).map((date) => (date ? String(date) : null)));
      }

      return rows;
    },

    /** The visible range as `start..end`, which is what every navigation assertion is about. */
    range: () => `${state.visibleRange.value.start}..${state.visibleRange.value.end}`,

    state: () => state,
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/*
 * Every expectation about where navigation lands was read off react-stately's own
 * `useCalendarState` driven through the same sequence, rather than derived by hand.
 */

describe("useCalendarState", () => {
  describe("what is visible", () => {
    it("centres a single month on the focused date", () => {
      expect(setup({defaultFocusedValue: jun(15)}).range()).toBe("2026-06-01..2026-06-30");
    });

    it("focuses today when nothing says otherwise", () => {
      const calendar = setup();

      expect(String(calendar.state().focusedDate.value)).toBe(String(today(getLocalTimeZone())));
    });

    it("prefers the selected date over today", () => {
      expect(String(setup({value: jun(9)}).state().focusedDate.value)).toBe("2026-06-09");
    });

    it("prefers an explicit focused date over the selection", () => {
      expect(
        String(setup({defaultFocusedValue: jun(23), value: jun(9)}).state().focusedDate.value),
      ).toBe("2026-06-23");
    });

    it("spans several months when asked to", () => {
      expect(setup({defaultFocusedValue: jun(15), visibleDuration: {months: 3}}).range()).toBe(
        "2026-05-01..2026-07-31",
      );
    });

    it("puts the focused month first when the alignment says start", () => {
      expect(
        setup({
          defaultFocusedValue: jun(15),
          selectionAlignment: "start",
          visibleDuration: {months: 3},
        }).range(),
      ).toBe("2026-06-01..2026-08-31");
    });

    it("puts the focused month last when the alignment says end", () => {
      expect(
        setup({
          defaultFocusedValue: jun(15),
          selectionAlignment: "end",
          visibleDuration: {months: 3},
        }).range(),
      ).toBe("2026-04-01..2026-06-30");
    });

    it("shows exactly the days a day view asks for, centred on the focused one", () => {
      expect(setup({defaultFocusedValue: jun(15), visibleDuration: {days: 3}}).range()).toBe(
        "2026-06-14..2026-06-16",
      );
    });

    it("aligns a week view to the locale's week", () => {
      expect(setup({defaultFocusedValue: jun(15), visibleDuration: {weeks: 1}}).range()).toBe(
        "2026-06-14..2026-06-20",
      );
      expect(
        setup({defaultFocusedValue: jun(15), locale: "de-DE", visibleDuration: {weeks: 1}}).range(),
      ).toBe("2026-06-15..2026-06-21");
    });

    it("clamps the visible range to the allowed bounds", () => {
      // Both bounds sit inside June, so the three months have to end there rather than straddle it.
      expect(
        setup({
          defaultFocusedValue: jun(15),
          maxValue: jun(18),
          minValue: jun(8),
          visibleDuration: {months: 3},
        }).range(),
      ).toBe("2026-04-01..2026-06-30");
    });
  });

  describe("the grid it produces", () => {
    it("pads the first row back to the start of the week", () => {
      // June 2026 starts on a Monday, so the Sunday before it fills the first cell.
      const [first] = setup({defaultFocusedValue: jun(15)}).grid();

      expect(first?.[0]).toBe("2026-05-31");
      expect(first?.[1]).toBe("2026-06-01");
    });

    it("follows the locale's first day of the week", () => {
      const [first] = setup({defaultFocusedValue: jun(15), locale: "de-DE"}).grid();

      expect(first?.[0]).toBe("2026-06-01");
    });

    it("follows an explicit first day of the week over the locale's", () => {
      const [first] = setup({defaultFocusedValue: jun(15), firstDayOfWeek: "wed"}).grid();

      expect(first?.[0]).toBe("2026-05-27");
    });

    it("gives a short day view one row of exactly that many days", () => {
      const calendar = setup({defaultFocusedValue: jun(15), visibleDuration: {days: 3}});

      expect(calendar.grid()).toEqual([["2026-06-14", "2026-06-15", "2026-06-16"]]);
    });

    it("holds the row count still when told how many weeks to show", () => {
      // A month grid that changes height as the user pages is what `weeksInMonth` is for.
      expect(setup({defaultFocusedValue: jun(15), weeksInMonth: 6}).grid()).toHaveLength(6);
      expect(setup({defaultFocusedValue: jun(15)}).grid()).toHaveLength(5);
    });
  });

  describe("moving focus", () => {
    it("steps a day at a time", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().focusNextDay();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-16");
      calendar.state().focusPreviousDay();
      calendar.state().focusPreviousDay();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-14");
    });

    it("steps a week at a time between rows", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().focusNextRow();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-22");
      calendar.state().focusPreviousRow();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-15");
    });

    it("pages instead of changing row in a day view", () => {
      // A day view has no row below the one on screen, so the whole page has to move.
      const calendar = setup({defaultFocusedValue: jun(15), visibleDuration: {days: 3}});

      calendar.state().focusNextRow();
      expect(calendar.range()).toBe("2026-06-17..2026-06-19");
    });

    it("moves the visible range with the focused date when it steps off the page", () => {
      const calendar = setup({defaultFocusedValue: new CalendarDate(2026, 6, 30)});

      calendar.state().focusNextDay();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-07-01");
      expect(calendar.range()).toBe("2026-07-01..2026-07-31");
    });

    it("pages forwards and back by the whole visible range", () => {
      const calendar = setup({defaultFocusedValue: jun(15), visibleDuration: {months: 2}});

      expect(calendar.range()).toBe("2026-06-01..2026-07-31");
      calendar.state().focusNextPage();
      expect(calendar.range()).toBe("2026-08-01..2026-09-30");
      calendar.state().focusPreviousPage();
      expect(calendar.range()).toBe("2026-06-01..2026-07-31");
    });

    it("pages by a single unit when told to", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        pageBehavior: "single",
        visibleDuration: {months: 2},
      });

      calendar.state().focusNextPage();
      expect(calendar.range()).toBe("2026-07-01..2026-08-31");
    });

    it("jumps to the ends of the current section", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().focusSectionEnd();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-30");
      calendar.state().focusSectionStart();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-01");
    });

    it("moves a month at a time between sections, and a year at a time when larger", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().focusNextSection();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-07-15");
      calendar.state().focusNextSection(true);
      expect(String(calendar.state().focusedDate.value)).toBe("2027-07-15");
      calendar.state().focusPreviousSection(true);
      calendar.state().focusPreviousSection();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-15");
    });

    it("never lets focus rest outside the bounds", () => {
      const calendar = setup({defaultFocusedValue: jun(15), maxValue: jun(18), minValue: jun(8)});

      calendar.state().setFocusedDate(new CalendarDate(2030, 1, 1));
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-18");
      calendar.state().setFocusedDate(new CalendarDate(2020, 1, 1));
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-08");
    });

    it("reports every move to onFocusChange", () => {
      const onFocusChange = vi.fn();
      const calendar = setup({defaultFocusedValue: jun(15), onFocusChange});

      calendar.state().focusNextDay();
      calendar.state().focusNextRow();

      expect(onFocusChange.mock.calls.map(([date]) => String(date))).toEqual([
        "2026-06-16",
        "2026-06-23",
      ]);
    });

    it("leaves a controlled focused date to its owner", async () => {
      const onFocusChange = vi.fn();
      const props = reactive({focusedValue: jun(15), onFocusChange});
      const calendar = setup(props);

      calendar.state().focusNextDay();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-15");
      expect(String(onFocusChange.mock.calls[0]?.[0])).toBe("2026-06-16");

      props.focusedValue = jun(16);
      await nextTick();
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-16");
    });
  });

  describe("selecting", () => {
    it("selects a date and reports it", () => {
      const onChange = vi.fn();
      const calendar = setup({defaultFocusedValue: jun(15), onChange});

      calendar.state().selectDate(jun(20));

      expect(String(calendar.state().value.value)).toBe("2026-06-20");
      expect(String(onChange.mock.calls[0]?.[0])).toBe("2026-06-20");
    });

    it("selects whatever is focused", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      calendar.state().selectFocusedDate();

      expect(String(calendar.state().value.value)).toBe("2026-06-15");
    });

    it("refuses to select an unavailable date", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        isDateUnavailable: (date: DateValue) => date.day === 15,
      });

      calendar.state().selectFocusedDate();

      expect(calendar.state().value.value).toBeNull();
    });

    it("keeps the time a value arrived with", () => {
      // Picking a day in a date picker must not silently reset the clock beside it. The state's own
      // `value` is date-only by design, so the time only shows up in what the owner is handed.
      const onChange = vi.fn();
      const calendar = setup({
        defaultValue: new CalendarDateTime(2026, 6, 10, 13, 45),
        onChange,
      });

      calendar.state().selectDate(jun(20));

      expect(String(onChange.mock.calls[0]?.[0])).toBe("2026-06-20T13:45:00");
      expect(String(calendar.state().value.value)).toBe("2026-06-20");
    });

    it("keeps the time zone a zoned value arrived with", () => {
      const calendar = setup({
        value: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 13, 45),
      });

      expect(calendar.state().timeZone.value).toBe("America/New_York");
    });

    it("does nothing while disabled or read only", () => {
      for (const props of [{isDisabled: true}, {isReadOnly: true}]) {
        const calendar = setup({...props, defaultFocusedValue: jun(15)});

        calendar.state().selectDate(jun(20));
        expect(calendar.state().value.value).toBeNull();
      }
    });

    it("toggles dates in and out in multiple mode", () => {
      const calendar = setup({defaultFocusedValue: jun(15), selectionMode: "multiple"});

      calendar.state().selectDate(jun(3));
      calendar.state().selectDate(jun(9));
      expect((calendar.state().value.value as CalendarDateType[]).map(String)).toEqual([
        "2026-06-03",
        "2026-06-09",
      ]);

      calendar.state().selectDate(jun(3));
      expect((calendar.state().value.value as CalendarDateType[]).map(String)).toEqual([
        "2026-06-09",
      ]);
    });

    it("clears to an empty list rather than null in multiple mode", () => {
      const onChange = vi.fn();
      const calendar = setup({
        onChange,
        selectionMode: "multiple",
        value: [jun(3), jun(9)],
      });

      calendar.state().setValue(null);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("walks a selection back to the nearest available date", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        isDateUnavailable: (date: DateValue) => date.day > 12 && date.day < 20,
      });

      calendar.state().setValue(jun(19));

      expect(String(calendar.state().value.value)).toBe("2026-06-12");
    });
  });

  describe("what each cell reports", () => {
    it("marks the selected date as selected", () => {
      const calendar = setup({value: jun(10)});

      expect(calendar.state().isSelected(jun(10))).toBe(true);
      expect(calendar.state().isSelected(jun(11))).toBe(false);
    });

    it("disables dates outside the visible range", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      expect(calendar.state().isCellDisabled(new CalendarDate(2026, 5, 31))).toBe(true);
      expect(calendar.state().isCellDisabled(jun(1))).toBe(false);
    });

    it("disables every cell when the calendar is disabled", () => {
      const calendar = setup({defaultFocusedValue: jun(15), isDisabled: true});

      expect(calendar.state().isCellDisabled(jun(15))).toBe(true);
    });

    it("reports unavailable dates without disabling them", () => {
      // Unavailable dates stay focusable, which is why the two flags are separate.
      const calendar = setup({
        defaultFocusedValue: jun(15),
        isDateUnavailable: (date: DateValue) => date.day === 16,
      });

      expect(calendar.state().isCellUnavailable(jun(16))).toBe(true);
      expect(calendar.state().isCellDisabled(jun(16))).toBe(false);
    });

    it("never reports an unavailable or disabled date as selected", () => {
      const calendar = setup({
        isDateUnavailable: (date: DateValue) => date.day === 10,
        value: jun(10),
      });

      expect(calendar.state().isSelected(jun(10))).toBe(false);
    });

    it("only reports a focused cell while focus is actually inside", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      expect(calendar.state().isCellFocused(jun(15))).toBe(false);
      calendar.state().setFocused(true);
      expect(calendar.state().isCellFocused(jun(15))).toBe(true);
      expect(calendar.state().isCellFocused(jun(16))).toBe(false);
    });

    it("takes focus on mount when asked to", () => {
      expect(setup({autoFocus: true, defaultFocusedValue: jun(15)}).state().isFocused.value).toBe(
        true,
      );
    });
  });

  describe("validity", () => {
    it("stays valid for a date inside the bounds", () => {
      expect(
        setup({maxValue: jun(18), minValue: jun(8), value: jun(10)}).state().isValueInvalid.value,
      ).toBe(false);
    });

    it("goes invalid for a selection outside the bounds", () => {
      expect(
        setup({maxValue: jun(18), value: new CalendarDate(2026, 7, 1)}).state().isValueInvalid
          .value,
      ).toBe(true);
    });

    it("goes invalid for an unavailable selection", () => {
      expect(
        setup({isDateUnavailable: (date: DateValue) => date.day === 10, value: jun(10)}).state()
          .isValueInvalid.value,
      ).toBe(true);
    });

    it("honours an explicitly invalid calendar", () => {
      expect(setup({isInvalid: true, value: jun(10)}).state().isValueInvalid.value).toBe(true);
    });

    it("goes invalid when any date in a multiple selection is", () => {
      expect(
        setup({
          maxValue: jun(18),
          selectionMode: "multiple",
          value: [jun(10), new CalendarDate(2026, 7, 1)],
        }).state().isValueInvalid.value,
      ).toBe(true);
    });
  });

  describe("whether paging is possible", () => {
    it("reports both directions open with no bounds", () => {
      const calendar = setup({defaultFocusedValue: jun(15)});

      expect(calendar.state().isPreviousVisibleRangeInvalid()).toBe(false);
      expect(calendar.state().isNextVisibleRangeInvalid()).toBe(false);
    });

    it("closes the direction a bound sits in", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        maxValue: new CalendarDate(2026, 6, 30),
        minValue: jun(1),
      });

      expect(calendar.state().isPreviousVisibleRangeInvalid()).toBe(true);
      expect(calendar.state().isNextVisibleRangeInvalid()).toBe(true);
    });
  });

  describe("reacting to its inputs changing", () => {
    it("realigns the visible range when the duration changes", async () => {
      const props: Record<string, unknown> = reactive({
        defaultFocusedValue: jun(15),
        visibleDuration: {months: 1},
      });
      const calendar = setup(props);

      expect(calendar.range()).toBe("2026-06-01..2026-06-30");

      props["visibleDuration"] = {months: 3};
      await nextTick();

      expect(calendar.range()).toBe("2026-05-01..2026-07-31");
    });

    it("rebuilds focus and the range in a new calendar system", async () => {
      const props: Record<string, unknown> = reactive({
        defaultFocusedValue: jun(15),
        locale: "en-US",
      });
      const calendar = setup(props);

      props["locale"] = "th-TH-u-ca-buddhist";
      await nextTick();

      expect(calendar.state().focusedDate.value.calendar.identifier).toBe("buddhist");
      expect(calendar.state().focusedDate.value.year).toBe(2569);
      // Still the same real day, just renumbered.
      expect(calendar.state().focusedDate.value.toString()).toBe("2026-06-15");
    });

    it("pulls focus back inside a bound that appears under it", async () => {
      // `maxValue` has to be present at mount: the harness only wires a getter for the keys the
      // props object had when it was rendered.
      const props: Record<string, unknown> = reactive({
        defaultFocusedValue: jun(15),
        maxValue: null,
      });
      const calendar = setup(props);

      props["maxValue"] = jun(10);
      await nextTick();

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-10");
    });
  });
});
