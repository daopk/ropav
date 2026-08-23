import type { DateRange } from "@/composables/use-calendar";
import type { RangeCalendarState } from "@/composables/use-range-calendar-state";
import type { DateValue } from "@internationalized/date";

import {
  BuddhistCalendar,
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";

import Host from "../fixtures/range-calendar-state-host.vue";

/** Mount the host and hand back the live state. */
const setup = (props: Record<string, unknown> = {}) => {
  let state!: RangeCalendarState;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: RangeCalendarState) => (state = value),
  });

  const result = renderVapor(Host, { props });

  return {
    ...result,

    /** The pending or selected range as `start..end`, which is what most assertions are about. */
    highlighted: () => {
      const range = state.highlightedRange.value;

      return range ? `${range.start}..${range.end}` : null;
    },

    /** The visible range as `start..end`. */
    range: () => `${state.visibleRange.value.start}..${state.visibleRange.value.end}`,

    state: () => state,

    value: () => {
      const range = state.value.value;

      return range ? `${range.start}..${range.end}` : null;
    },
  };
};

const jun = (day: number) => new CalendarDate(2026, 6, day);

/*
 * Every expectation below was read off react-stately's own `useRangeCalendarState` driven through
 * the same sequence, rather than derived by hand.
 */

describe("useRangeCalendarState", () => {
  describe("what is visible", () => {
    it("centres the visible range on a selection that fits inside it", () => {
      expect(
        setup({ value: { end: jun(14), start: jun(10) }, visibleDuration: { months: 3 } }).range(),
      ).toBe("2026-05-01..2026-07-31");
    });

    it("starts the visible range on a selection that would spill past it", () => {
      expect(
        setup({
          value: { end: new CalendarDate(2026, 10, 4), start: jun(10) },
          visibleDuration: { months: 3 },
        }).range(),
      ).toBe("2026-06-01..2026-08-31");
    });

    it("keeps an explicit alignment over the one the selection implies", () => {
      expect(
        setup({
          selectionAlignment: "center",
          value: { end: new CalendarDate(2026, 10, 4), start: jun(10) },
          visibleDuration: { months: 3 },
        }).range(),
      ).toBe("2026-05-01..2026-07-31");
    });

    it("opens on the start of the selected range", () => {
      expect(
        String(setup({ value: { end: jun(14), start: jun(10) } }).state().focusedDate.value),
      ).toBe("2026-06-10");
    });
  });

  describe("building a range", () => {
    it("pins one end on the first selection without emitting a value", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(10), onChange });

      calendar.state().selectDate(jun(10));

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
      expect(calendar.value()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("highlights the pinned end alone until the other one is chosen", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(10));

      expect(calendar.highlighted()).toBe("2026-06-10..2026-06-10");
    });

    it("emits the range and drops the anchor on the second selection", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(10), onChange });

      calendar.state().selectDate(jun(10));
      calendar.state().selectDate(jun(14));

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
      expect(calendar.state().anchorDate.value).toBeNull();
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("orders a range selected backwards", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(16));

      expect(calendar.value()).toBe("2026-06-16..2026-06-20");
    });

    it("selects the focused date", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectFocusedDate();

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
    });

    it("refuses to select while read only", () => {
      const calendar = setup({ defaultFocusedValue: jun(10), isReadOnly: true });

      calendar.state().selectDate(jun(10));

      expect(calendar.state().anchorDate.value).toBeNull();
    });

    it("skips a focused date the caller ruled out", () => {
      const calendar = setup({
        defaultFocusedValue: jun(10),
        isDateUnavailable: (date: DateValue) => date.day === 10,
      });

      calendar.state().selectFocusedDate();

      expect(calendar.state().anchorDate.value).toBeNull();
    });

    it("selects nothing when the whole stretch back to the first visible date is unavailable", () => {
      const calendar = setup({
        defaultFocusedValue: jun(10),
        isDateUnavailable: (date: DateValue) => date.month === 6,
      });

      calendar.state().selectDate(jun(20));

      expect(calendar.state().anchorDate.value).toBeNull();
    });
  });

  describe("highlighting", () => {
    it("follows the pointer while a range is being built", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));

      expect(calendar.highlighted()).toBe("2026-06-10..2026-06-14");
      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-14");
    });

    it("ignores a hover when no end is pinned", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().highlightDate(jun(20));

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-10");
    });

    it("reports every date between the two ends as selected", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));

      expect([9, 10, 11, 14, 15].map((day) => calendar.state().isSelected(jun(day)))).toEqual([
        false,
        true,
        true,
        true,
        false,
      ]);
    });

    it("highlights the selected range when nothing is pending", () => {
      expect(setup({ value: { end: jun(14), start: jun(10) } }).highlighted()).toBe(
        "2026-06-10..2026-06-14",
      );
    });
  });

  describe("committing and clearing", () => {
    it("ends a pending range on the focused date", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(10));
      calendar.state().setFocusedDate(jun(13));
      calendar.state().commitSelection();

      expect(calendar.value()).toBe("2026-06-10..2026-06-13");
      expect(calendar.state().anchorDate.value).toBeNull();
    });

    it("drops both the anchor and the value", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(10), onChange });

      calendar.state().selectDate(jun(10));
      calendar.state().selectDate(jun(13));
      calendar.state().clearSelection();

      expect(calendar.value()).toBeNull();
      expect(calendar.state().anchorDate.value).toBeNull();
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("takes an anchor set from outside", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().setAnchorDate(jun(20));

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-20");

      calendar.state().setAnchorDate(null);

      expect(calendar.state().anchorDate.value).toBeNull();
    });
  });

  describe("contiguity", () => {
    const isDateUnavailable = (date: DateValue) => date.day === 12 || date.day === 18;

    it("stops a range at the nearest unavailable date on either side", () => {
      const calendar = setup({ defaultFocusedValue: jun(15), isDateUnavailable });

      calendar.state().selectDate(jun(15));

      expect(
        [11, 12, 13, 14, 16, 17, 18, 19].map((day) => calendar.state().isCellDisabled(jun(day))),
      ).toEqual([true, true, false, false, false, false, true, true]);
    });

    it("marks what a range cannot reach as invalid rather than merely disabled", () => {
      const calendar = setup({
        defaultFocusedValue: jun(15),
        isDateUnavailable: (date: DateValue) => date.day === 18,
      });

      calendar.state().selectDate(jun(15));

      expect([16, 17, 18, 19, 20].map((day) => calendar.state().isInvalid(jun(day)))).toEqual([
        false,
        false,
        true,
        true,
        true,
      ]);
    });

    it("lifts the limit when non-contiguous ranges are allowed", () => {
      const calendar = setup({
        allowsNonContiguousRanges: true,
        defaultFocusedValue: jun(15),
        isDateUnavailable,
      });

      calendar.state().selectDate(jun(15));

      expect(
        [11, 12, 13, 14, 16, 17, 18, 19].map((day) => calendar.state().isCellDisabled(jun(day))),
      ).toEqual([false, false, false, false, false, false, false, false]);
    });

    it("hands the pinned end to the caller's own predicate", () => {
      const seen: (string | null)[] = [];
      const calendar = setup({
        defaultFocusedValue: jun(15),
        isDateUnavailable: (_date: DateValue, anchorDate: CalendarDate | null) => {
          seen.push(anchorDate ? String(anchorDate) : null);

          return false;
        },
      });

      calendar.state().isCellUnavailable(jun(11));

      expect(seen.at(-1)).toBeNull();

      calendar.state().selectDate(jun(15));
      calendar.state().isCellUnavailable(jun(11));

      expect(seen.at(-1)).toBe("2026-06-15");
    });

    it("leaves the visible range alone while the bounds tighten", () => {
      const calendar = setup({ defaultFocusedValue: jun(15), isDateUnavailable });

      calendar.state().selectDate(jun(15));

      expect(calendar.range()).toBe("2026-06-01..2026-06-30");
    });
  });

  describe("moving focus off a pinned end", () => {
    it("steps forward by a day", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().selectDate(jun(15));
      calendar.state().focusNearestAvailableDate(jun(15));

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-16");
      expect(calendar.state().isFocused.value).toBe(true);
    });

    it("steps back when forward is blocked", () => {
      const calendar = setup({
        defaultFocusedValue: jun(10),
        isDateUnavailable: (date: DateValue) => date.day === 16,
      });

      calendar.state().selectDate(jun(15));
      calendar.state().focusNearestAvailableDate(jun(15));

      expect(String(calendar.state().focusedDate.value)).toBe("2026-06-14");
    });
  });

  describe("the emitted value", () => {
    it("keeps the time each end came in with", () => {
      const onChange = vi.fn();
      const calendar = setup({
        onChange,
        value: {
          end: new CalendarDateTime(2026, 6, 14, 9, 30),
          start: new CalendarDateTime(2026, 6, 10, 13, 45),
        },
      });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(22));

      const emitted = onChange.mock.lastCall![0] as DateRange;

      expect(`${emitted.start}..${emitted.end}`).toBe("2026-06-20T13:45:00..2026-06-22T09:30:00");
    });

    it("keeps the time zone each end came in with", () => {
      const onChange = vi.fn();
      const calendar = setup({
        onChange,
        value: {
          end: new ZonedDateTime(2026, 6, 14, "America/New_York", -14400000, 9, 30),
          start: new ZonedDateTime(2026, 6, 10, "America/New_York", -14400000, 13, 45),
        },
      });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(22));

      const emitted = onChange.mock.lastCall![0] as DateRange;

      expect(`${emitted.start}..${emitted.end}`).toBe(
        "2026-06-20T13:45:00-04:00[America/New_York]..2026-06-22T09:30:00-04:00[America/New_York]",
      );
      expect(calendar.state().timeZone.value).toBe("America/New_York");
    });

    it("keeps the calendar system each end came in with", () => {
      const onChange = vi.fn();
      const calendar = setup({
        onChange,
        value: {
          end: new CalendarDate(new BuddhistCalendar(), 2569, 6, 14),
          start: new CalendarDate(new BuddhistCalendar(), 2569, 6, 10),
        },
      });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(22));

      const emitted = onChange.mock.lastCall![0] as DateRange;

      expect(emitted.start.calendar.identifier).toBe("buddhist");
      expect(emitted.end.calendar.identifier).toBe("buddhist");
      expect(String(emitted.start)).toBe("2026-06-20");
    });

    it("emits a Gregorian range when there was nothing to inherit from", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(10), onChange });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(22));

      const emitted = onChange.mock.lastCall![0] as DateRange;

      expect(emitted.start.calendar.identifier).toBe("gregory");
    });
  });

  describe("validity", () => {
    it("calls a range with an unavailable end invalid", () => {
      expect(
        setup({
          isDateUnavailable: (date: DateValue) => date.day === 10,
          value: { end: jun(14), start: jun(10) },
        }).state().isValueInvalid.value,
      ).toBe(true);
    });

    it("calls a range reaching outside the bounds invalid", () => {
      expect(
        setup({ minValue: jun(12), value: { end: jun(14), start: jun(10) } }).state().isValueInvalid
          .value,
      ).toBe(true);
    });

    it("says nothing about validity while an end is still being pinned", () => {
      const calendar = setup({ minValue: jun(12), value: { end: jun(14), start: jun(10) } });

      calendar.state().setAnchorDate(jun(20));

      expect(calendar.state().isValueInvalid.value).toBe(false);
    });

    it("takes the caller's word for it", () => {
      expect(setup({ isInvalid: true }).state().isValueInvalid.value).toBe(true);
    });

    it("calls a range inside the bounds valid", () => {
      expect(
        setup({
          maxValue: jun(20),
          minValue: jun(8),
          value: { end: jun(14), start: jun(10) },
        }).state().isValueInvalid.value,
      ).toBe(false);
    });
  });

  describe("dragging", () => {
    it("reports whether a pointer is dragging a range out", () => {
      const calendar = setup();

      expect(calendar.state().isDragging.value).toBe(false);

      calendar.state().setDragging(true);

      expect(calendar.state().isDragging.value).toBe(true);
    });
  });

  describe("the value the caller controls", () => {
    it("takes a range written from outside", () => {
      const calendar = setup({ defaultFocusedValue: jun(10) });

      calendar.state().setValue({ end: jun(9), start: jun(5) });

      expect(calendar.value()).toBe("2026-06-05..2026-06-09");
    });

    it("only reports a controlled range, leaving the owner to write it", () => {
      const onChange = vi.fn();
      const calendar = setup({ onChange, value: { end: jun(14), start: jun(10) } });

      calendar.state().selectDate(jun(20));
      calendar.state().selectDate(jun(22));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
    });
  });
});
