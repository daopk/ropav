import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderHeader = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const header = result.container.querySelector('[data-slot="header"]');

  if (!header) throw new Error("header not rendered");

  return { ...result, header };
};

describe("Header", () => {
  describe("structure", () => {
    it("renders a header element carrying its data-slot", () => {
      const { header } = renderHeader();

      expect(header.tagName).toBe("HEADER");
      expect(header).toHaveTextContent("Actions");
    });

    it("applies the base class", () => {
      const { header } = renderHeader();

      expect(header).toHaveClass("rp-header");
    });

    it("merges a caller class", () => {
      const { header } = renderHeader({ class: "px-2" });

      expect(header).toHaveClass("rp-header", "px-2");
    });
  });

  describe("field ids", () => {
    it("takes no id and no role when it stands on its own", () => {
      const { header } = renderHeader();

      expect(header).not.toHaveAttribute("id");
      expect(header).not.toHaveAttribute("role");
    });

    it("claims the id its section points aria-labelledby at", async () => {
      const { container, header } = renderHeader({ withFieldIds: true });

      await nextTick();

      const id = header.getAttribute("id");

      expect(id).toBeTruthy();
      expect(container.firstElementChild).toHaveAttribute("aria-labelledby", id!);
    });

    it("takes the role its section asks for", () => {
      // ARIA does not allow a heading inside a listbox, so a section demotes it to
      // presentation and uses it only as the group's visual label.
      const { header } = renderHeader({ headingRole: "presentation", withFieldIds: true });

      expect(header).toHaveAttribute("role", "presentation");
    });
  });
});
