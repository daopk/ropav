import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderDescription = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const description = result.container.querySelector('[data-slot="description"]');

  if (!description) throw new Error("description not rendered");

  return { ...result, description };
};

describe("Description", () => {
  describe("structure", () => {
    it("renders a span carrying its data-slot", () => {
      const { description } = renderDescription();

      expect(description.tagName).toBe("SPAN");
      expect(description).toHaveTextContent("We never share your address");
    });

    it("applies the base class", () => {
      const { description } = renderDescription();

      expect(description).toHaveClass("rp-description");
    });

    it("merges a caller class", () => {
      const { description } = renderDescription({ class: "text-wrap" });

      expect(description).toHaveClass("rp-description", "text-wrap");
    });
  });

  describe("field ids", () => {
    it("renders on its own, without waiting for a container", () => {
      // React gates Description behind a slot check and renders nothing outside a field.
      // That gate only exists because React Aria renders collection children twice; with a
      // single render pass there is nothing to wait for.
      const { description } = renderDescription();

      expect(description).toBeInTheDocument();
      expect(description).not.toHaveAttribute("id");
    });

    it("claims the id its container points aria-describedby at", async () => {
      const { container, description } = renderDescription({ withFieldIds: true });

      await nextTick();

      const id = description.getAttribute("id");

      expect(id).toBeTruthy();
      expect(container.firstElementChild).toHaveAttribute("data-described-by", id!);
    });
  });
});
