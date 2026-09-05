import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import { Separator } from "@/components/separator";

const renderSeparator = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Separator, { props });
  const separator = result.container.querySelector('[data-slot="separator"]');

  if (!separator) throw new Error("separator not rendered");

  return { ...result, separator };
};

describe("Separator", () => {
  describe("horizontal", () => {
    it("renders an hr, which already means separator", () => {
      const { separator } = renderSeparator();

      expect(separator.tagName).toBe("HR");
    });

    it("declares the separator role and leaves aria-orientation implicit", () => {
      // The role is redundant on an `hr`, but React Aria emits it there anyway, so matching it
      // keeps the two builds' markup identical. `aria-orientation` genuinely is left out:
      // horizontal is the ARIA default and React omits it too.
      const { separator } = renderSeparator();

      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).not.toHaveAttribute("aria-orientation");
    });

    it("exposes its orientation to the stylesheet", () => {
      const { separator } = renderSeparator();

      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator).toHaveClass("rp-separator", "rp-separator--horizontal");
    });
  });

  describe("vertical", () => {
    it("renders a div, because an hr cannot be vertical", () => {
      const { separator } = renderSeparator({ orientation: "vertical" });

      expect(separator.tagName).toBe("DIV");
    });

    it("declares the role and orientation the element does not imply", () => {
      const { separator } = renderSeparator({ orientation: "vertical" });

      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator).toHaveClass("rp-separator", "rp-separator--vertical");
    });
  });

  describe("variants", () => {
    it("defaults to the default variant", () => {
      const { separator } = renderSeparator();

      expect(separator).toHaveClass("rp-separator--default");
    });

    it.each(["secondary", "tertiary"] as const)("renders the %s variant", (variant) => {
      const { separator } = renderSeparator({ variant });

      expect(separator).toHaveClass(`rp-separator--${variant}`);
    });
  });

  describe("class merging", () => {
    it("merges a caller class", () => {
      const { separator } = renderSeparator({ class: "my-4" });

      expect(separator).toHaveClass("rp-separator", "my-4");
    });
  });
});
