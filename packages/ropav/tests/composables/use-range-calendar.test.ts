import type { UseRangeCalendarReturn } from "@/composables/use-range-calendar";
import type { RangeCalendarState } from "@/composables/use-range-calendar-state";

import { CalendarDate } from "@internationalized/date";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Host from "../fixtures/range-calendar-host.vue";

type Ready = { calendar: UseRangeCalendarReturn; state: RangeCalendarState };

const mounted: (() => void)[] = [];

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: Ready;

  Object.assign(props, {
    locale: props["locale"] ?? "en-US",
    onReady: (value: Ready) => (ready = value),
  });

  const result = renderVapor(Host, { props });

  // Idempotent, so a test that unmounts on purpose does not unmount twice through the hook below.
  let isUnmounted = false;
  const unmount = () => {
    if (isUnmounted) return;
    isUnmounted = true;
    result.unmount();
  };

  mounted.push(unmount);

  const query = <T extends HTMLElement>(slot: string) =>
    result.container.querySelector<T>(`[data-slot='${slot}']`)!;

  return {
    ...result,
    calendar: () => ready.calendar,
    cell: () => query("range-calendar-cell"),
    next: () => query<HTMLButtonElement>("range-calendar-next"),
    outside: () => query<HTMLButtonElement>("range-calendar-outside"),
    root: () => query("range-calendar-host"),
    state: () => ready.state,
    unmount,

    value: () => {
      const range = ready.state.value.value;

      return range ? `${range.start}..${range.end}` : null;
    },
  };
};

/*
 * Every harness attaches window listeners, so one left mounted would keep answering pointer events
 * raised by the next test.
 */
afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

const jun = (day: number) => new CalendarDate(2026, 6, day);

/** A release with a real contact patch, as opposed to the zero-sized one a screen reader sends. */
const release = (target: EventTarget = window) =>
  target.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, height: 23, width: 17 }));

const press = (width: number, height: number) =>
  window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, height, width }));

describe("useRangeCalendar", () => {
  describe("what it inherits from a plain calendar", () => {
    it("takes role application so a screen reader leaves the arrow keys alone", () => {
      expect(setup().root().getAttribute("role")).toBe("application");
    });

    it("names itself after the dates on screen", () => {
      expect(
        setup({ defaultFocusedValue: jun(15) })
          .root()
          .getAttribute("aria-label"),
      ).toContain("June 2026");
    });

    it("titles itself with the visible range", () => {
      expect(setup({ defaultFocusedValue: jun(15) }).calendar().title.value).toBe("June 2026");
    });

    it("pages on the next button", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.next().click();

      expect(calendar.calendar().title.value).toBe("July 2026");
    });
  });

  describe("a pointer released outside", () => {
    it("ends the pending range on the highlighted date", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));
      calendar.cell().focus();
      release();

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
      expect(calendar.state().anchorDate.value).toBeNull();
    });

    it("clears the selection when told to", () => {
      const calendar = setup({
        commitBehavior: "clear",
        defaultFocusedValue: jun(15),
        defaultValue: { end: jun(9), start: jun(5) },
      });

      calendar.state().selectDate(jun(10));
      calendar.cell().focus();
      release();

      expect(calendar.value()).toBeNull();
      expect(calendar.state().anchorDate.value).toBeNull();
    });

    it("puts the previous range back when told to", () => {
      const onChange = vi.fn();
      const calendar = setup({
        commitBehavior: "reset",
        defaultFocusedValue: jun(15),
        defaultValue: { end: jun(9), start: jun(5) },
        onChange,
      });

      calendar.state().selectDate(jun(20));
      calendar.cell().focus();
      release();

      expect(calendar.value()).toBe("2026-06-05..2026-06-09");
      expect(calendar.state().anchorDate.value).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("leaves a pending range alone when focus has already left the calendar", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.outside().focus();
      release();

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
      expect(calendar.value()).toBeNull();
    });

    it("leaves a pending range alone when the release lands on a button inside", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.cell().focus();
      release(calendar.next());

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
    });

    it("ends the range when the release lands on something inside that is not a button", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(12));
      calendar.cell().focus();
      release(calendar.root().querySelector("[data-slot='range-calendar-title']")!);

      expect(calendar.value()).toBe("2026-06-10..2026-06-12");
    });

    it("does nothing at all without a pending range", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(15), onChange });

      calendar.cell().focus();
      release();

      expect(onChange).not.toHaveBeenCalled();
      expect(calendar.value()).toBeNull();
    });

    it("stops reporting a drag either way", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().setDragging(true);
      release();

      expect(calendar.state().isDragging.value).toBe(false);
    });

    it("ignores the zero-sized release a screen reader sends before the click it stands for", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.cell().focus();
      press(0, 0);
      release();

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
    });

    it("acts on the release after a real press", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));
      calendar.cell().focus();
      press(17, 23);
      release();

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
    });

    it("only skips the one release the zero-sized press was about", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));
      calendar.cell().focus();
      press(0, 0);
      release();
      release();

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
    });

    it("stops answering once the calendar is gone", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });
      const state = calendar.state();

      state.selectDate(jun(10));
      calendar.cell().focus();
      calendar.unmount();
      release();

      expect(String(state.anchorDate.value)).toBe("2026-06-10");
    });
  });

  describe("focus leaving the calendar", () => {
    const leave = (calendar: ReturnType<typeof setup>, relatedTarget: EventTarget | null) =>
      calendar
        .cell()
        .dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: relatedTarget }));

    it("ends the pending range", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));
      leave(calendar, calendar.outside());

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
    });

    it("ends the pending range when focus went nowhere at all", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      calendar.state().highlightDate(jun(14));
      leave(calendar, null);

      expect(calendar.value()).toBe("2026-06-10..2026-06-14");
    });

    it("leaves the range alone while focus stays inside", () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().selectDate(jun(10));
      leave(calendar, calendar.next());

      expect(String(calendar.state().anchorDate.value)).toBe("2026-06-10");
      expect(calendar.value()).toBeNull();
    });

    it("does nothing without a pending range", () => {
      const onChange = vi.fn();
      const calendar = setup({ defaultFocusedValue: jun(15), onChange });

      leave(calendar, calendar.outside());

      expect(onChange).not.toHaveBeenCalled();
    });

    it("clears the selection when told to", () => {
      const calendar = setup({
        commitBehavior: "clear",
        defaultFocusedValue: jun(15),
        defaultValue: { end: jun(9), start: jun(5) },
      });

      calendar.state().selectDate(jun(20));
      leave(calendar, calendar.outside());

      expect(calendar.value()).toBeNull();
    });
  });

  describe("a finger dragging a range out", () => {
    /*
     * The listener is attached post-flush, because the element it goes on is a template ref that
     * only exists once the calendar has rendered.
     */
    const scroll = async (calendar: ReturnType<typeof setup>) => {
      await nextTick();

      const event = new Event("touchmove", { bubbles: true, cancelable: true });

      calendar.cell().dispatchEvent(event);

      return event.defaultPrevented;
    };

    it("keeps the page from scrolling under it", async () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().setDragging(true);

      expect(await scroll(calendar)).toBe(true);
    });

    it("lets the page scroll when no range is being dragged", async () => {
      expect(await scroll(setup({ defaultFocusedValue: jun(15) }))).toBe(false);
    });

    it("stops holding the page once the calendar is gone", async () => {
      const calendar = setup({ defaultFocusedValue: jun(15) });

      calendar.state().setDragging(true);
      await nextTick();

      const cell = calendar.cell();

      calendar.unmount();

      const event = new Event("touchmove", { bubbles: true, cancelable: true });

      cell.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });
});
