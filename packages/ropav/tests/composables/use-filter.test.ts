import type { I18nHostReady } from "../fixtures/i18n.types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick, reactive } from "vue";

import Harness from "../fixtures/i18n-harness.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let ready!: I18nHostReady;

  Object.assign(props, { onReady: (value: I18nHostReady) => (ready = value) });

  return { ...renderVapor(Harness, { props }), ready: () => ready };
};

describe("useCollator", () => {
  it("compares in the locale an ancestor chose", () => {
    // Swedish sorts "ä" after "z"; German sorts it with "a". Same two strings, opposite answers.
    const swedish = setup({ locale: "sv-SE" });
    const german = setup({ locale: "de-DE" });

    expect(swedish.ready().collator.value.compare("ä", "z")).toBeGreaterThan(0);
    expect(german.ready().collator.value.compare("ä", "z")).toBeLessThan(0);

    swedish.unmount();
    german.unmount();
  });

  it("reuses one collator per locale and options", () => {
    const first = setup({ locale: "en-US" });
    const second = setup({ locale: "en-US" });

    // Building one is expensive enough that React Aria caches across components too.
    expect(first.ready().collator.value).toBe(second.ready().collator.value);

    first.unmount();
    second.unmount();
  });

  it("follows the locale changing", async () => {
    const props = reactive({ locale: "en-US" });
    const { ready, unmount } = setup(props);
    const first = ready().collator.value;

    props.locale = "sv-SE";
    await nextTick();

    expect(ready().collator.value).not.toBe(first);
    unmount();
  });
});

describe("useFilter", () => {
  describe("startsWith", () => {
    it("matches a prefix", () => {
      const { ready, unmount } = setup({ locale: "de-DE" });

      expect(ready().filter.value.startsWith("M\u00E4rz", "M\u00E4r")).toBe(true);
      expect(ready().filter.value.startsWith("M\u00E4rz", "Mai")).toBe(false);
      unmount();
    });

    it("keeps case apart by default", () => {
      // A `search` collator given no sensitivity is full strength, as in React Aria.
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().filter.value.startsWith("AM", "a")).toBe(false);
      unmount();
    });

    it("ignores case when asked to", () => {
      // This is what a date field needs, and why `useDateSegment` passes `sensitivity: "base"`:
      // typing `a` has to select the AM period.
      const { ready, unmount } = setup({ filterOptions: { sensitivity: "base" }, locale: "en-US" });

      expect(ready().filter.value.startsWith("AM", "a")).toBe(true);
      expect(ready().filter.value.startsWith("PM", "a")).toBe(false);
      unmount();
    });

    it("ignores accents when asked to", () => {
      const { ready, unmount } = setup({ filterOptions: { sensitivity: "base" }, locale: "fr-FR" });

      expect(ready().filter.value.startsWith("f\u00E9vrier", "fev")).toBe(true);
      expect(ready().filter.value.startsWith("f\u00E9vrier", "jan")).toBe(false);
      unmount();
    });

    it("still separates letters the locale counts as distinct", () => {
      // German collates "\u00E4" as its own letter, so base sensitivity does not fold it into "a"
      // the way it does in English or French. Locale collation, not a filter of ours.
      const german = setup({ filterOptions: { sensitivity: "base" }, locale: "de-DE" });
      const english = setup({ filterOptions: { sensitivity: "base" }, locale: "en-US" });

      expect(german.ready().filter.value.startsWith("M\u00E4rz", "marz")).toBe(false);
      expect(english.ready().filter.value.startsWith("M\u00E4rz", "marz")).toBe(true);

      german.unmount();
      english.unmount();
    });

    it("treats an empty needle as always matching", () => {
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().filter.value.startsWith("June", "")).toBe(true);
      unmount();
    });

    it("does not match a needle longer than the string", () => {
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().filter.value.startsWith("Jun", "June")).toBe(false);
      unmount();
    });
  });

  describe("endsWith", () => {
    it("matches the tail", () => {
      const { ready, unmount } = setup({ locale: "fr-FR" });

      expect(ready().filter.value.endsWith("f\u00E9vrier", "vrier")).toBe(true);
      expect(ready().filter.value.endsWith("f\u00E9vrier", "janv")).toBe(false);
      unmount();
    });

    it("ignores accents in the tail when asked to", () => {
      const { ready, unmount } = setup({ filterOptions: { sensitivity: "base" }, locale: "fr-FR" });

      expect(ready().filter.value.endsWith("ao\u00FBt", "out")).toBe(true);
      unmount();
    });

    it("treats an empty needle as always matching", () => {
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().filter.value.endsWith("June", "")).toBe(true);
      unmount();
    });
  });

  describe("contains", () => {
    it("finds a needle anywhere in the string", () => {
      const { ready, unmount } = setup({ locale: "de-DE" });

      expect(ready().filter.value.contains("Dezember", "zemb")).toBe(true);
      expect(ready().filter.value.contains("Dezember", "xyz")).toBe(false);
      unmount();
    });

    it("finds a needle whose accents differ when asked to", () => {
      const { ready, unmount } = setup({ filterOptions: { sensitivity: "base" }, locale: "fr-FR" });

      expect(ready().filter.value.contains("f\u00E9vrier", "evri")).toBe(true);
      unmount();
    });

    it("treats an empty needle as always matching", () => {
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().filter.value.contains("June", "")).toBe(true);
      unmount();
    });
  });

  describe("normalization", () => {
    it("matches a decomposed needle against a composed string", () => {
      // "\u00E4" can be one code point or "a" plus a combining diaeresis. Slicing by length
      // without normalising first would cut the mark off its base character.
      const { ready, unmount } = setup({ locale: "de-DE" });
      // Spelled out with escapes, because the two forms are indistinguishable as source text.
      const composed = "M\u00E4rz";
      const decomposed = "Ma\u0308rz";

      expect(composed).not.toBe(decomposed);
      expect(ready().filter.value.startsWith(composed, decomposed)).toBe(true);
      expect(ready().filter.value.startsWith(decomposed, composed)).toBe(true);
      expect(ready().filter.value.contains(composed, "\u00E4r")).toBe(true);
      expect(ready().filter.value.endsWith(decomposed, "\u00E4rz")).toBe(true);
      unmount();
    });
  });
});
