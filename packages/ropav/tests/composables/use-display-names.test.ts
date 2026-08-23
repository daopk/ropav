import type {I18nHostReady} from "../fixtures/i18n.types";

import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import Harness from "../fixtures/i18n-harness.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: I18nHostReady;

  Object.assign(props, {onReady: (value: I18nHostReady) => (ready = value)});

  return {...renderVapor(Harness, {props}), ready: () => ready};
};

/**
 * Make the engine look like one whose `Intl.DisplayNames` predates the `dateTimeField` type.
 *
 * That is the case the shipped strings exist for, and it cannot be reached by choosing a locale —
 * the constructor itself has to refuse.
 */
const withoutDateTimeField = () =>
  vi.spyOn(Intl, "DisplayNames").mockImplementation(() => {
    throw new RangeError("invalid value dateTimeField for option type");
  });

afterEach(() => vi.restoreAllMocks());

describe("useDisplayNames", () => {
  describe("naming the parts of a date", () => {
    it("names each part in the locale's own words", () => {
      const {ready, unmount} = setup({locale: "en-US"});
      const names = ready().displayNames.value;

      expect(names.of("year")).toBe("year");
      expect(names.of("month")).toBe("month");
      expect(names.of("day")).toBe("day");
      // Not a translation of "day period" — this is the name the reader would recognise.
      expect(names.of("dayPeriod")).toBe("AM/PM");
      unmount();
    });

    it("follows the locale an ancestor chose", () => {
      const {ready, unmount} = setup({locale: "de-DE"});
      const names = ready().displayNames.value;

      expect(names.of("year")).toBe("Jahr");
      expect(names.of("hour")).toBe("Stunde");
      unmount();
    });

    it("follows the locale changing", async () => {
      const props = reactive({locale: "en-US"});
      const {ready, unmount} = setup(props);

      expect(ready().displayNames.value.of("month")).toBe("month");

      props.locale = "ja-JP";
      await nextTick();

      expect(ready().displayNames.value.of("month")).toBe("月");
      unmount();
    });
  });

  describe("without engine support", () => {
    it("falls back to the shipped strings", () => {
      withoutDateTimeField();

      const {ready, unmount} = setup({locale: "en-US"});
      const names = ready().displayNames.value;

      expect(names.of("year")).toBe("year");
      expect(names.of("dayPeriod")).toBe("AM/PM");
      expect(names.of("weekday")).toBe("day of the week");
      unmount();
    });

    it("still follows the locale", () => {
      withoutDateTimeField();

      const {ready, unmount} = setup({locale: "de-DE"});

      expect(ready().displayNames.value.of("year")).toBe("Jahr");
      unmount();
    });

    it("falls back to English for a locale the strings do not cover", () => {
      withoutDateTimeField();

      // Only 34 locales ship, and Hindi is not one of them, so English stands in.
      const {ready, unmount} = setup({locale: "hi-IN"});

      expect(ready().displayNames.value.of("year")).toBe("year");
      unmount();
    });

    it("has no name for a part that is not a field", () => {
      withoutDateTimeField();

      const {ready, unmount} = setup({locale: "en-US"});

      expect(ready().displayNames.value.of("literal")).toBeUndefined();
      unmount();
    });
  });
});
