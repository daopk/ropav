import { afterEach, describe, expect, it, vi } from "vitest";

import { getDefaultLocale, isRTL } from "@/utils/locale";

/** Replace `navigator.language`, which is read-only, for the duration of one test. */
const stubLanguage = (language: string | undefined) => {
  const spy = vi.spyOn(navigator, "language", "get");

  spy.mockReturnValue(language as string);

  return spy;
};

describe("isRTL", () => {
  describe("right-to-left locales", () => {
    it.each([
      ["ar-AE", "Arabic"],
      ["he-IL", "Hebrew"],
      ["fa-IR", "Persian"],
      ["ur-PK", "Urdu"],
      ["dv-MV", "Dhivehi"],
    ])("reports %s as right to left (%s)", (locale) => {
      expect(isRTL(locale)).toBe(true);
    });
  });

  describe("left-to-right locales", () => {
    it.each(["en-US", "de-DE", "ja-JP", "hi-IN", "zh-Hans-CN", "ru-RU"])(
      "reports %s as left to right",
      (locale) => {
        expect(isRTL(locale)).toBe(false);
      },
    );
  });

  describe("script over language", () => {
    it("follows the script when a language is written in more than one", () => {
      // Kurdish reads right to left in Arabic script and left to right in Latin script, so a
      // guess made from the language alone would get one of the two wrong.
      expect(isRTL("ku-Arab")).toBe(true);
      expect(isRTL("ku-Latn")).toBe(false);
    });
  });

  describe("bare language tags", () => {
    it("resolves a tag carrying no region", () => {
      expect(isRTL("ar")).toBe(true);
      expect(isRTL("en")).toBe(false);
    });
  });

  describe("unicode extensions", () => {
    it("ignores a calendar extension when reading direction", () => {
      expect(isRTL("hi-IN-u-ca-indian")).toBe(false);
      expect(isRTL("ar-SA-u-ca-islamic")).toBe(true);
    });
  });
});

describe("getDefaultLocale", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the browser's language and its direction", () => {
    stubLanguage("he-IL");

    expect(getDefaultLocale()).toEqual({ direction: "rtl", locale: "he-IL" });
  });

  it("reports a left-to-right language as such", () => {
    stubLanguage("en-GB");

    expect(getDefaultLocale()).toEqual({ direction: "ltr", locale: "en-GB" });
  });

  it("falls back to en-US for a tag Intl cannot use", () => {
    // A structurally invalid tag makes `supportedLocalesOf` throw rather than return empty, which
    // is the only signal that the browser's own setting is unusable.
    stubLanguage("not a language tag");

    expect(getDefaultLocale()).toEqual({ direction: "ltr", locale: "en-US" });
  });

  it("falls back to en-US when the browser names no language", () => {
    stubLanguage(undefined);

    expect(getDefaultLocale()).toEqual({ direction: "ltr", locale: "en-US" });
  });
});
