import type {DefaultDateProps} from "@/composables/use-default-date-props";

import {CalendarDate, CalendarDateTime, ZonedDateTime} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick, reactive} from "vue";

import Host from "../fixtures/default-date-props-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: DefaultDateProps;

  Object.assign(props, {onReady: (value: DefaultDateProps) => (ready = value)});

  return {...renderVapor(Host, {props}), resolved: () => ready};
};

describe("useDefaultDateProps", () => {
  describe("granularity", () => {
    it("falls back to the day when there is no value", () => {
      expect(setup().resolved().granularity.value).toBe("day");
    });

    it("reads the day off a plain date", () => {
      expect(setup({value: new CalendarDate(2026, 6, 15)}).resolved().granularity.value).toBe(
        "day",
      );
    });

    it("reads the minute off a value that carries a time", () => {
      expect(
        setup({value: new CalendarDateTime(2026, 6, 15, 13, 45)}).resolved().granularity.value,
      ).toBe("minute");
    });

    it("takes what the caller asked for over what the value implies", () => {
      expect(
        setup({granularity: "hour", value: new CalendarDateTime(2026, 6, 15, 13, 45)}).resolved()
          .granularity.value,
      ).toBe("hour");
    });

    it("takes what the caller asked for with no value at all", () => {
      expect(setup({granularity: "second"}).resolved().granularity.value).toBe("second");
    });

    it("refuses a granularity the value cannot carry", () => {
      // A caller asking for minutes from a plain date has made a mistake that would otherwise
      // surface much later, as a segment nothing can edit.
      const {resolved} = setup({granularity: "minute", value: new CalendarDate(2026, 6, 15)});

      expect(() => resolved().granularity.value).toThrow(/Invalid granularity minute/);
    });
  });

  describe("the time zone", () => {
    it("is absent for a value that has none", () => {
      expect(
        setup({value: new CalendarDateTime(2026, 6, 15, 13, 45)}).resolved().defaultTimeZone.value,
      ).toBeUndefined();
    });

    it("comes off a zoned value", () => {
      expect(
        setup({
          value: new ZonedDateTime(2026, 6, 15, "America/New_York", -14400000, 13, 45),
        }).resolved().defaultTimeZone.value,
      ).toBe("America/New_York");
    });
  });

  describe("what it remembers", () => {
    it("keeps the time granularity after the value is cleared", async () => {
      /*
       * The point of remembering at all: a date-and-time control emptied by the user must keep its
       * time segments rather than collapse to the date-only default while it is being edited.
       */
      const props = reactive<{value: CalendarDateTime | null}>({
        value: new CalendarDateTime(2026, 6, 15, 13, 45),
      });
      const {resolved} = setup(props);

      expect(resolved().granularity.value).toBe("minute");

      props.value = null;
      await nextTick();

      expect(resolved().granularity.value).toBe("minute");
    });

    it("keeps the time zone after the value is cleared", async () => {
      const props = reactive<{value: ZonedDateTime | null}>({
        value: new ZonedDateTime(2026, 6, 15, "America/New_York", -14400000, 13, 45),
      });
      const {resolved} = setup(props);

      props.value = null;
      await nextTick();

      expect(resolved().defaultTimeZone.value).toBe("America/New_York");
    });

    it("remembers a value that arrived and was cleared inside one turn", () => {
      /*
       * No tick in between, which is what makes this the discriminating case: with a deferred
       * watcher the datetime is never seen at all, so clearing takes the control back to the
       * date-only default and its time segments disappear. A picker reads `hasTime` in the same
       * turn its owner writes the value, so the answer cannot be a tick behind.
       */
      const props = reactive<{value: CalendarDate | CalendarDateTime | null}>({
        value: new CalendarDate(2026, 6, 15),
      });
      const {resolved} = setup(props);

      props.value = new CalendarDateTime(2026, 6, 15, 13, 45);
      props.value = null;

      expect(resolved().granularity.value).toBe("minute");
    });

    it("follows a value that changes shape", async () => {
      const props = reactive<{value: CalendarDate | CalendarDateTime | null}>({
        value: new CalendarDate(2026, 6, 15),
      });
      const {resolved} = setup(props);

      expect(resolved().granularity.value).toBe("day");

      props.value = new CalendarDateTime(2026, 6, 15, 13, 45);
      await nextTick();

      expect(resolved().granularity.value).toBe("minute");
    });
  });
});
