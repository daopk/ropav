import {describe, expect, it, vi} from "vitest";

import {CardHeader} from "@/components/card";

import {renderVapor} from "../../helpers";

import CardFixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

describe("Card", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderVapor(CardFixture);

      expect(slot(container, "card")).not.toBeNull();
      expect(slot(container, "card-header")).not.toBeNull();
      expect(slot(container, "card-title")).not.toBeNull();
      expect(slot(container, "card-description")).not.toBeNull();
      expect(slot(container, "card-content")).not.toBeNull();
      expect(slot(container, "card-footer")).not.toBeNull();

      unmount();
    });

    it("renders slot content into each part", () => {
      const {container, getByText, unmount} = renderVapor(CardFixture);

      expect(getByText("Card title")).toBeDefined();
      expect(slot(container, "card-content")?.textContent).toContain("Card content");
      expect(slot(container, "card-footer")?.textContent).toContain("Card footer");

      unmount();
    });

    it("renders the title as a heading and the description as a paragraph", () => {
      const {container, unmount} = renderVapor(CardFixture);

      expect(slot(container, "card-title")?.tagName).toBe("H3");
      expect(slot(container, "card-description")?.tagName).toBe("P");

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class on the root", () => {
      const {container, unmount} = renderVapor(CardFixture);

      expect(slot(container, "card")?.classList.contains("card")).toBe(true);

      unmount();
    });

    it("applies the variant modifier class", () => {
      const {container, unmount} = renderVapor(CardFixture, {props: {variant: "secondary"}});

      expect(slot(container, "card")?.classList.contains("card--secondary")).toBe(true);

      unmount();
    });

    it("defaults to the default variant", () => {
      const {container, unmount} = renderVapor(CardFixture);

      expect(slot(container, "card")?.classList.contains("card--default")).toBe(true);

      unmount();
    });

    it("renders the element classes on the child parts", () => {
      const {container, unmount} = renderVapor(CardFixture);

      expect(slot(container, "card-header")?.classList.contains("card__header")).toBe(true);
      expect(slot(container, "card-title")?.classList.contains("card__title")).toBe(true);
      expect(slot(container, "card-content")?.classList.contains("card__content")).toBe(true);

      unmount();
    });

    it("merges a caller class onto the root", () => {
      const {container, unmount} = renderVapor(CardFixture, {props: {class: "w-96"}});
      const root = slot(container, "card");

      expect(root?.classList.contains("card")).toBe(true);
      expect(root?.classList.contains("w-96")).toBe(true);

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
