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
  describe("locale", () => {
    it("collates in the locale an ancestor chose", () => {
      // German sorts ä with a; Swedish sorts it after z. Same two strings, opposite answers.
      const german = setup({ locale: "de-DE" });

      expect(german.ready().collator.value.compare("ä", "z")).toBeLessThan(0);
      german.unmount();

      const swedish = setup({ locale: "sv-SE" });

      expect(swedish.ready().collator.value.compare("ä", "z")).toBeGreaterThan(0);
      swedish.unmount();
    });

    it("follows the locale changing", async () => {
      const props = reactive({ locale: "de-DE" });
      const { ready, unmount } = setup(props);

      expect(ready().collator.value.compare("ä", "z")).toBeLessThan(0);

      props.locale = "sv-SE";
      await nextTick();

      expect(ready().collator.value.compare("ä", "z")).toBeGreaterThan(0);
      unmount();
    });

    it("reports the locale it resolved to", () => {
      const { ready, unmount } = setup({ locale: "fr-FR" });

      // The language, not the exact tag: ICU drops a region whose collation matches the base
      // language, so `fr-FR` resolves to `fr` while `en-US` keeps its region.
      expect(ready().collator.value.resolvedOptions().locale).toMatch(/^fr\b/);
      unmount();
    });
  });

  describe("options", () => {
    it("treats accents as equal at base sensitivity", () => {
      const { ready, unmount } = setup({
        collatorOptions: { sensitivity: "base" },
        locale: "en-US",
      });

      expect(ready().collator.value.compare("resume", "résumé")).toBe(0);
      unmount();
    });

    it("distinguishes accents by default", () => {
      const { ready, unmount } = setup({ locale: "en-US" });

      expect(ready().collator.value.compare("resume", "résumé")).not.toBe(0);
      unmount();
    });

    it("orders numbers as numbers when asked", () => {
      const { ready, unmount } = setup({ collatorOptions: { numeric: true }, locale: "en-US" });

      expect(ready().collator.value.compare("item2", "item10")).toBeLessThan(0);
      unmount();
    });
  });

  describe("caching", () => {
    /*
     * Building a collator is expensive and one is stateless once built, which is why upstream
     * caches them across components rather than per call site.
     */
    it("hands the same instance to two callers asking for the same locale and options", () => {
      const first = setup({ locale: "en-US" });
      const second = setup({ locale: "en-US" });

      expect(first.ready().collator.value).toBe(second.ready().collator.value);

      first.unmount();
      second.unmount();
    });

    it("keys the cache on the options too", () => {
      const plain = setup({ locale: "en-GB" });
      const base = setup({ collatorOptions: { sensitivity: "base" }, locale: "en-GB" });

      expect(plain.ready().collator.value).not.toBe(base.ready().collator.value);

      plain.unmount();
      base.unmount();
    });

    it("keys the cache on the locale too", () => {
      const english = setup({ locale: "en-AU" });
      const french = setup({ locale: "fr-CA" });

      expect(english.ready().collator.value).not.toBe(french.ready().collator.value);

      english.unmount();
      french.unmount();
    });
  });
});
