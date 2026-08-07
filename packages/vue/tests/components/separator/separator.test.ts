import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";

import {SeparatorRoot} from "@/components/separator";

const renderSeparator = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(SeparatorRoot, {props});
  const separator = result.container.querySelector('[data-slot="separator"]');

  if (!separator) throw new Error("separator not rendered");

  return {...result, separator};
};

describe("Separator", () => {
  describe("horizontal", () => {
    it("renders an hr, which already means separator", () => {
      const {separator} = renderSeparator();

      expect(separator.tagName).toBe("HR");
    });

    it("leaves role and aria-orientation implicit", () => {
      // An `hr` carries both by default; spelling them out would be redundant markup that
      // would also show up as a diff against the React build.
      const {separator} = renderSeparator();

      expect(separator).not.toHaveAttribute("role");
      expect(separator).not.toHaveAttribute("aria-orientation");
    });

    it("exposes its orientation to the stylesheet", () => {
      const {separator} = renderSeparator();

      expect(separator).toHaveAttribute("data-orientation", "horizontal");
      expect(separator).toHaveClass("separator", "separator--horizontal");
    });
  });

  describe("vertical", () => {
    it("renders a div, because an hr cannot be vertical", () => {
      const {separator} = renderSeparator({orientation: "vertical"});

      expect(separator.tagName).toBe("DIV");
    });

    it("declares the role and orientation the element does not imply", () => {
      const {separator} = renderSeparator({orientation: "vertical"});

      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
      expect(separator).toHaveClass("separator", "separator--vertical");
    });
  });

  describe("variants", () => {
    it("defaults to the default variant", () => {
      const {separator} = renderSeparator();

      expect(separator).toHaveClass("separator--default");
    });

    it.each(["secondary", "tertiary"] as const)("renders the %s variant", (variant) => {
      const {separator} = renderSeparator({variant});

      expect(separator).toHaveClass(`separator--${variant}`);
    });
  });

  describe("class merging", () => {
    it("merges a caller class", () => {
      const {separator} = renderSeparator({class: "my-4"});

      expect(separator).toHaveClass("separator", "my-4");
    });
  });
});
