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

/** Non-breaking and narrow no-break spaces, so an assertion reads as the eye sees it. */
const normalize = (value: string) => value.replace(/[  ]/g, " ");

describe("useNumberFormatter", () => {
  describe("locale", () => {
    it("formats in the locale an ancestor chose", () => {
      const { ready, unmount } = setup({ locale: "de-DE" });

      expect(normalize(ready().numberFormatter.value.format(1234.5))).toBe("1.234,5");
      unmount();
    });

    it("follows the locale changing", async () => {
      const props = reactive({ locale: "en-US" });
      const { ready, unmount } = setup(props);

      expect(normalize(ready().numberFormatter.value.format(1234.5))).toBe("1,234.5");

      props.locale = "de-DE";
      await nextTick();

      expect(normalize(ready().numberFormatter.value.format(1234.5))).toBe("1.234,5");
      unmount();
    });
  });

  describe("options", () => {
    it("formats a currency", () => {
      const { ready, unmount } = setup({
        locale: "en-US",
        numberOptions: { currency: "USD", style: "currency" },
      });

      expect(normalize(ready().numberFormatter.value.format(12.5))).toBe("$12.50");
      unmount();
    });

    it("formats a percentage", () => {
      const { ready, unmount } = setup({ locale: "en-US", numberOptions: { style: "percent" } });

      expect(normalize(ready().numberFormatter.value.format(0.25))).toBe("25%");
      unmount();
    });

    it("honours fraction digits", () => {
      const { ready, unmount } = setup({
        locale: "en-US",
        numberOptions: { minimumFractionDigits: 2 },
      });

      expect(normalize(ready().numberFormatter.value.format(1))).toBe("1.00");
      unmount();
    });

    it("reflects the options changing", async () => {
      const props = reactive({
        locale: "en-US",
        numberOptions: { style: "percent" } as Record<string, unknown>,
      });
      const { ready, unmount } = setup(props);

      expect(normalize(ready().numberFormatter.value.format(0.25))).toBe("25%");

      props.numberOptions = { maximumFractionDigits: 1 };
      await nextTick();

      expect(normalize(ready().numberFormatter.value.format(0.25))).toBe("0.3");
      unmount();
    });
  });

  describe("sign display", () => {
    /*
     * The reason this wraps `@internationalized/number`'s `NumberFormatter` rather than reaching
     * for `Intl` directly: it carries the `signDisplay` fallback for engines that lack it.
     */
    it("marks a positive number when asked", () => {
      const { ready, unmount } = setup({
        locale: "en-US",
        numberOptions: { signDisplay: "exceptZero" },
      });
      const formatter = ready().numberFormatter.value;

      expect(normalize(formatter.format(5))).toBe("+5");
      expect(normalize(formatter.format(-5))).toBe("-5");
      expect(normalize(formatter.format(0))).toBe("0");
      unmount();
    });
  });
});
