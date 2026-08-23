import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { CardHeader } from "@/components/card";

import CardFixture from "./fixtures.vue";
import SurfaceFixture from "./surface-fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

describe("Card", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const { container, unmount } = renderVapor(CardFixture);

      expect(slot(container, "card")).not.toBeNull();
      expect(slot(container, "card-header")).not.toBeNull();
      expect(slot(container, "card-title")).not.toBeNull();
      expect(slot(container, "card-description")).not.toBeNull();
      expect(slot(container, "card-content")).not.toBeNull();
      expect(slot(container, "card-footer")).not.toBeNull();

      unmount();
    });

    it("renders slot content into each part", () => {
      const { container, getByText, unmount } = renderVapor(CardFixture);

      expect(getByText("Card title")).toBeDefined();
      expect(slot(container, "card-content")?.textContent).toContain("Card content");
      expect(slot(container, "card-footer")?.textContent).toContain("Card footer");

      unmount();
    });

    it("renders the title as a heading and the description as a paragraph", () => {
      const { container, unmount } = renderVapor(CardFixture);

      expect(slot(container, "card-title")?.tagName).toBe("H3");
      expect(slot(container, "card-description")?.tagName).toBe("P");

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class on the root", () => {
      const { container, unmount } = renderVapor(CardFixture);

      expect(slot(container, "card")?.classList.contains("card")).toBe(true);

      unmount();
    });

    it("applies the variant modifier class", () => {
      const { container, unmount } = renderVapor(CardFixture, { props: { variant: "secondary" } });

      expect(slot(container, "card")?.classList.contains("card--secondary")).toBe(true);

      unmount();
    });

    it("defaults to the default variant", () => {
      const { container, unmount } = renderVapor(CardFixture);

      expect(slot(container, "card")?.classList.contains("card--default")).toBe(true);

      unmount();
    });

    it("renders the element classes on the child parts", () => {
      const { container, unmount } = renderVapor(CardFixture);

      expect(slot(container, "card-header")?.classList.contains("card__header")).toBe(true);
      expect(slot(container, "card-title")?.classList.contains("card__title")).toBe(true);
      expect(slot(container, "card-content")?.classList.contains("card__content")).toBe(true);

      unmount();
    });

    it("merges a caller class onto the root", () => {
      const { container, unmount } = renderVapor(CardFixture, { props: { class: "w-96" } });
      const root = slot(container, "card");

      expect(root?.classList.contains("card")).toBe(true);
      expect(root?.classList.contains("w-96")).toBe(true);

      unmount();
    });
  });

  describe("surface context", () => {
    const surfaceOf = (props: Record<string, unknown> = {}) => {
      const result = renderVapor(SurfaceFixture, { props });
      const consumer = result.container.querySelector('[data-testid="consumer"]');

      if (!consumer) throw new Error("consumer not rendered");

      return { ...result, consumer };
    };

    it.each(["default", "secondary", "tertiary"] as const)(
      "tells descendants they sit on a %s card",
      (variant) => {
        const { consumer, unmount } = surfaceOf({ variant });

        expect(consumer).toHaveAttribute("data-surface", variant);

        unmount();
      },
    );

    it("passes the default variant down, not undefined", () => {
      const { consumer, unmount } = surfaceOf();

      expect(consumer).toHaveAttribute("data-surface", "default");

      unmount();
    });

    it("offers no surface for a transparent card standing alone", () => {
      // Transparent shows the page behind it, so there is no surface to report.
      const { consumer, unmount } = surfaceOf({ variant: "transparent" });

      expect(consumer).toHaveAttribute("data-surface", "none");

      unmount();
    });

    it("forwards the surface behind a transparent card", () => {
      const { consumer, unmount } = surfaceOf({
        outerVariant: "secondary",
        variant: "transparent",
      });

      expect(consumer).toHaveAttribute("data-surface", "secondary");

      unmount();
    });

    it("shadows an outer surface with its own variant", () => {
      const { consumer, unmount } = surfaceOf({ outerVariant: "tertiary", variant: "secondary" });

      expect(consumer).toHaveAttribute("data-surface", "secondary");

      unmount();
    });

    it("follows the variant when it changes", async () => {
      // `provide` runs once, so the transparent decision has to be read on every access
      // rather than fixed at setup.
      const props = reactive({ outerVariant: "tertiary", variant: "default" });
      const { consumer, unmount } = surfaceOf(props);

      expect(consumer).toHaveAttribute("data-surface", "default");

      props.variant = "transparent";
      await nextTick();

      expect(consumer).toHaveAttribute("data-surface", "tertiary");

      unmount();
    });
  });

  describe("context", () => {
    it("throws when a part renders outside the root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(CardHeader)).toThrow(/`CardContext` was consumed outside/);

      warn.mockRestore();
    });
  });
});
