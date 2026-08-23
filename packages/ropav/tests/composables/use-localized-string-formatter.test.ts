import type {I18nHostReady} from "../fixtures/i18n.types";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {nextTick, reactive} from "vue";

import {useLocalizedStringDictionary} from "@/composables/use-localized-string-formatter";
import {calendarStrings} from "@/i18n/calendar";
import {datepickerStrings} from "@/i18n/datepicker";

import Harness from "../fixtures/i18n-harness.vue";

/**
 * Mount the harness and hand back what the host resolved.
 *
 * `props` is passed by reference: `renderVapor` reads each key through a getter, so a `reactive`
 * object handed in here keeps driving the component.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let ready!: I18nHostReady;

  Object.assign(props, {onReady: (value: I18nHostReady) => (ready = value)});

  return {...renderVapor(Harness, {props}), ready: () => ready};
};

describe("useLocalizedStringDictionary", () => {
  it("reuses one dictionary per table of strings", () => {
    // A dictionary is derived entirely from its strings and read-only afterwards, so building a
    // second one per consumer would be pure waste.
    expect(useLocalizedStringDictionary(calendarStrings)).toBe(
      useLocalizedStringDictionary(calendarStrings),
    );
  });

  it("keeps separate dictionaries for separate tables", () => {
    expect(useLocalizedStringDictionary(calendarStrings)).not.toBe(
      useLocalizedStringDictionary(datepickerStrings),
    );
  });
});

describe("useLocalizedStringFormatter", () => {
  describe("locale", () => {
    it("formats in the locale an ancestor chose", () => {
      const {ready, unmount} = setup({locale: "de-DE"});

      expect(ready().strings.value.format("previous")).toBe("Zurück");
      unmount();
    });

    it("follows the locale changing", async () => {
      const props = reactive({locale: "en-US"});
      const {ready, unmount} = setup(props);

      expect(ready().strings.value.format("previous")).toBe("Previous");

      props.locale = "fr-FR";
      await nextTick();

      expect(ready().strings.value.format("previous")).toBe("Précédent");
      unmount();
    });

    it("falls back to English for a locale the table has no strings for", () => {
      const {ready, unmount} = setup({locale: "cy-GB"});

      expect(ready().strings.value.format("previous")).toBe("Previous");
      unmount();
    });

    it("resolves a region it has no exact entry for to the language", () => {
      // The table ships `de-DE`, not `de-AT`, and an Austrian user should still read German.
      const {ready, unmount} = setup({locale: "de-AT"});

      expect(ready().strings.value.format("previous")).toBe("Zurück");
      unmount();
    });

    it("ignores a unicode extension when choosing strings", () => {
      const {ready, unmount} = setup({locale: "de-DE-u-ca-buddhist"});

      expect(ready().strings.value.format("previous")).toBe("Zurück");
      unmount();
    });

    it("falls back to English for a language the table does not ship", () => {
      // React Aria ships 34 locales and Hindi is not one of them, so the `hi-IN-u-ca-indian`
      // story reads English labels there too. The tag still decides the calendar system and the
      // date formatting; only these strings fall back.
      const {ready, unmount} = setup({locale: "hi-IN-u-ca-indian"});

      expect(ready().strings.value.format("previous")).toBe("Previous");
      unmount();
    });
  });

  describe("variables", () => {
    it("interpolates a message's arguments", () => {
      const {ready, unmount} = setup({locale: "en-US"});

      expect(ready().strings.value.format("dateSelected", {date: "June 5"})).toBe(
        "June 5 selected",
      );
      unmount();
    });

    it("interpolates every argument of a multi-variable message", () => {
      const {ready, unmount} = setup({locale: "en-US"});

      expect(
        ready().strings.value.format("dateRange", {endDate: "June 9", startDate: "June 5"}),
      ).toBe("June 5 to June 9");
      unmount();
    });

    it("interpolates in a locale that reorders the arguments", () => {
      // German puts "Ausgewähltes Datum" first too, but the point is that the compiled message
      // carries its own word order rather than a shared template being filled in.
      const {ready, unmount} = setup({locale: "de-DE"});

      expect(ready().strings.value.format("selectedDateDescription", {date: "5. Juni"})).toBe(
        "Ausgewähltes Datum: 5. Juni",
      );
      unmount();
    });
  });
});
