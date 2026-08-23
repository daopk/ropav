import { describe, expect, it } from "vitest";

import { getDatePlaceholder } from "@/utils/date-placeholder";

describe("getDatePlaceholder", () => {
  describe("date fields", () => {
    it.each([
      ["year", "yyyy"],
      ["month", "mm"],
      ["day", "dd"],
    ])("spells out %s in English", (field, expected) => {
      expect(getDatePlaceholder(field, "", "en-US")).toBe(expected);
    });

    it("spells the fields out in the locale's own letters", () => {
      // German day is "tt" for *Tag*, French is "jj" for *jour* — this is not a translation of
      // "dd" but what each browser puts in its own `<input type="date">`.
      expect(getDatePlaceholder("day", "", "de-DE")).toBe("tt");
      expect(getDatePlaceholder("day", "", "fr-FR")).toBe("jj");
      expect(getDatePlaceholder("year", "", "fr-FR")).toBe("aaaa");
    });

    it("resolves a region it has no exact entry for to the language", () => {
      // The table is keyed by language, so every German region has to land on the German row.
      expect(getDatePlaceholder("month", "", "de-AT")).toBe("mm");
      expect(getDatePlaceholder("day", "", "de-CH")).toBe("tt");
    });

    it("keeps script variants apart", () => {
      // Serbian in Cyrillic and Serbian in Latin get different letters, and the table has a row
      // for the Latin one specifically.
      expect(getDatePlaceholder("year", "", "sr")).toBe("гггг");
      expect(getDatePlaceholder("year", "", "sr-Latn")).toBe("gggg");
    });

    it("falls back to English for a language the table does not cover", () => {
      expect(getDatePlaceholder("day", "", "cy-GB")).toBe("dd");
    });
  });

  describe("fields with no useful abbreviation", () => {
    it("shows an era's real value", () => {
      // There is nothing to spell out for "AD", so the value itself stands in for it.
      expect(getDatePlaceholder("era", "AD", "en-US")).toBe("AD");
      expect(getDatePlaceholder("era", "n. Chr.", "de-DE")).toBe("n. Chr.");
    });

    it("shows a day period's real value", () => {
      expect(getDatePlaceholder("dayPeriod", "AM", "en-US")).toBe("AM");
    });
  });

  describe("time fields", () => {
    it.each(["hour", "minute", "second", "timeZoneName", "weekday"])(
      "falls back to dashes for %s",
      (field) => {
        expect(getDatePlaceholder(field, "", "en-US")).toBe("––");
      },
    );

    it("uses dashes regardless of locale", () => {
      expect(getDatePlaceholder("hour", "", "ja-JP")).toBe("––");
    });
  });
});
