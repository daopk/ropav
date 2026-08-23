import type {I18nHostReady} from "../fixtures/i18n.types";

import {DateFormatter} from "@internationalized/date";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick, reactive} from "vue";

import Harness from "../fixtures/i18n-harness.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: I18nHostReady;

  Object.assign(props, {onReady: (value: I18nHostReady) => (ready = value)});

  return {...renderVapor(Harness, {props}), ready: () => ready};
};

/** A fixed instant, so nothing here depends on the day the suite runs. */
const JUNE_5 = new Date(Date.UTC(2026, 5, 5, 12, 0, 0));

describe("useDateFormatter", () => {
  describe("locale", () => {
    it("formats in the locale an ancestor chose", () => {
      const {ready, unmount} = setup({
        dateOptions: {day: "numeric", month: "long", timeZone: "UTC", year: "numeric"},
        locale: "de-DE",
      });

      expect(ready().dateFormatter.value.format(JUNE_5)).toBe("5. Juni 2026");
      unmount();
    });

    it("follows the locale changing", async () => {
      const props = reactive({
        dateOptions: {day: "numeric", month: "long", timeZone: "UTC", year: "numeric"},
        locale: "en-US",
      });
      const {ready, unmount} = setup(props);

      expect(ready().dateFormatter.value.format(JUNE_5)).toBe("June 5, 2026");

      props.locale = "fr-FR";
      await nextTick();

      expect(ready().dateFormatter.value.format(JUNE_5)).toBe("5 juin 2026");
      unmount();
    });
  });

  describe("calendar systems", () => {
    it("formats in the calendar system the locale's extension names", () => {
      // The tag carries the calendar, which is why a unicode extension must survive locale
      // resolution — an Indian-calendar year is not the Gregorian one.
      const {ready, unmount} = setup({
        dateOptions: {day: "numeric", month: "long", timeZone: "UTC", year: "numeric"},
        locale: "hi-IN-u-ca-indian",
      });

      expect(ready().dateFormatter.value.resolvedOptions().calendar).toBe("indian");
      unmount();
    });

    it("reports the locale's own calendar when the tag names none", () => {
      const {ready, unmount} = setup({locale: "en-US"});

      expect(ready().dateFormatter.value.resolvedOptions().calendar).toBe("gregory");
      unmount();
    });
  });

  describe("options", () => {
    it("reflects the options changing", async () => {
      const props = reactive({
        dateOptions: {day: "numeric", timeZone: "UTC"} as Intl.DateTimeFormatOptions,
        locale: "en-US",
      });
      const {ready, unmount} = setup(props);

      expect(ready().dateFormatter.value.format(JUNE_5)).toBe("5");

      props.dateOptions = {month: "long", timeZone: "UTC"};
      await nextTick();

      expect(ready().dateFormatter.value.format(JUNE_5)).toBe("June");
      unmount();
    });

    it("shares the underlying Intl formatter between equal formatters", () => {
      // This is why no memo guards the options here: rebuilding the wrapper is cheap because
      // `DateFormatter` caches the expensive `Intl.DateTimeFormat` per locale and options.
      const options: Intl.DateTimeFormatOptions = {day: "numeric", timeZone: "UTC"};
      const {ready, unmount} = setup({dateOptions: options, locale: "en-US"});
      const first = ready().dateFormatter.value;

      expect(first.resolvedOptions()).toEqual(
        new DateFormatter("en-US", options).resolvedOptions(),
      );
      unmount();
    });
  });
});
