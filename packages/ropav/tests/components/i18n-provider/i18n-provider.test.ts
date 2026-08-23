import type { Locale } from "@/utils/locale";
import type { ComputedRef } from "vue";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let locale!: ComputedRef<Locale>;

  Object.assign(props, { onReady: (value: ComputedRef<Locale>) => (locale = value) });

  return { ...renderVapor(Fixture, { props }), locale: () => locale };
};

describe("I18nProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("locale", () => {
    it("applies its locale to the content below", () => {
      const { locale, unmount } = setup({ locale: "de-DE" });

      expect(locale().value).toEqual({ direction: "ltr", locale: "de-DE" });
      unmount();
    });

    it("resolves a right-to-left tag's direction", () => {
      const { locale, unmount } = setup({ locale: "ar-AE" });

      expect(locale().value).toEqual({ direction: "rtl", locale: "ar-AE" });
      unmount();
    });

    it("keeps a calendar extension on the tag", () => {
      // The story that exercises a non-Gregorian calendar passes the system on the tag, so losing
      // the extension here would silently put it back on the Gregorian calendar.
      const { locale, unmount } = setup({ locale: "hi-IN-u-ca-indian" });

      expect(locale().value.locale).toBe("hi-IN-u-ca-indian");
      unmount();
    });

    it("follows its locale changing", async () => {
      const props = reactive({ locale: "en-US" });
      const { locale, unmount } = setup(props);

      expect(locale().value.direction).toBe("ltr");

      props.locale = "he-IL";
      await nextTick();

      expect(locale().value).toEqual({ direction: "rtl", locale: "he-IL" });
      unmount();
    });

    it("leaves the browser's locale in force when given none", () => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
      const { locale, unmount } = setup({});

      expect(locale().value).toEqual({ direction: "ltr", locale: "fr-FR" });
      unmount();
    });
  });

  describe("rendering", () => {
    it("renders its content without an element of its own", () => {
      const { container, unmount } = setup({ locale: "en-US" });

      // Every consumer reads the locale through `useLocale`, so a wrapper would add a DOM node
      // that no style or query expects — React Aria's provider renders none either.
      expect(container.querySelector("[data-slot='locale-host']")).not.toBeNull();
      expect(container.firstElementChild?.getAttribute("data-slot")).toBe("locale-host");
      unmount();
    });
  });
});
