import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderErrorMessage = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const errorMessage = result.container.querySelector('[data-slot="error-message"]');

  if (!errorMessage) throw new Error("error message not rendered");

  return { ...result, errorMessage };
};

describe("ErrorMessage", () => {
  describe("structure", () => {
    it("renders a span carrying its data-slot", () => {
      const { errorMessage } = renderErrorMessage();

      expect(errorMessage.tagName).toBe("SPAN");
      expect(errorMessage).toHaveTextContent("Enter a valid email");
    });

    it("applies the base class", () => {
      const { errorMessage } = renderErrorMessage();

      expect(errorMessage).toHaveClass("error-message");
    });

    it("merges a caller class", () => {
      const { errorMessage } = renderErrorMessage({ class: "p-1" });

      expect(errorMessage).toHaveClass("error-message", "p-1");
    });
  });

  describe("field ids", () => {
    it("renders on its own, without waiting for a container", () => {
      const { errorMessage } = renderErrorMessage();

      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).not.toHaveAttribute("id");
    });

    it("claims the id its field points aria-describedby at", async () => {
      const { container, errorMessage } = renderErrorMessage({ withFieldIds: true });

      await nextTick();

      const id = errorMessage.getAttribute("id");

      expect(id).toBeTruthy();
      expect(container.firstElementChild).toHaveAttribute("data-described-by", id!);
    });

    it("is listed after the description, whichever mounts first", async () => {
      const { container, errorMessage } = renderErrorMessage({
        withDescription: true,
        withFieldIds: true,
      });

      await nextTick();

      const description = container.querySelector('[data-slot="description"]');

      expect(container.firstElementChild).toHaveAttribute(
        "data-described-by",
        `${description!.getAttribute("id")} ${errorMessage.getAttribute("id")}`,
      );
    });
  });
});
