import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";

import { Surface } from "@/components/surface";

import Fixture from "./fixtures.vue";

const renderSurface = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Surface, { props });
  const surface = result.container.querySelector('[data-slot="surface"]');

  if (!surface) throw new Error("surface not rendered");

  return { ...result, surface };
};

const renderWithConsumer = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  return {
    ...result,
    consumer: result.container.querySelector('[data-testid="consumer"]')!,
    nested: result.container.querySelector('[data-testid="nested-consumer"]'),
  };
};

describe("Surface", () => {
  describe("structure", () => {
    it("renders a div carrying its data-slot", () => {
      const { surface } = renderSurface();

      expect(surface.tagName).toBe("DIV");
    });

    it("merges a caller class", () => {
      const { surface } = renderSurface({ class: "rounded-3xl" });

      expect(surface).toHaveClass("surface", "rounded-3xl");
    });
  });

  describe("variants", () => {
    it("defaults to the default variant", () => {
      const { surface } = renderSurface();

      expect(surface).toHaveClass("surface", "surface--default");
    });

    it.each(["secondary", "tertiary", "transparent"] as const)(
      "renders the %s variant",
      (variant) => {
        const { surface } = renderSurface({ variant });

        expect(surface).toHaveClass(`surface--${variant}`);
      },
    );
  });

  describe("context", () => {
    it("tells descendants which surface they sit on", () => {
      const { consumer } = renderWithConsumer({ variant: "secondary" });

      expect(consumer).toHaveAttribute("data-surface", "secondary");
    });

    it("passes the default variant down, not undefined", () => {
      // A descendant picking an on-surface colour needs a value, so the default has to be
      // resolved here rather than left for every consumer to re-derive.
      const { consumer } = renderWithConsumer({});

      expect(consumer).toHaveAttribute("data-surface", "default");
    });

    it("shadows an outer surface with the nearest one", () => {
      const { nested } = renderWithConsumer({ nestedVariant: "tertiary", variant: "secondary" });

      expect(nested).toHaveAttribute("data-surface", "tertiary");
    });
  });
});
