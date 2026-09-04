import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { ChipLabel } from "@/components/chip";

import ChipFixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

describe("Chip", () => {
  describe("label", () => {
    it("wraps a text-only child in ChipLabel", () => {
      const { container, unmount } = renderVapor(ChipFixture);
      const label = slot(container, "chip-label");

      expect(label?.textContent).toBe("Label");
      expect(label?.classList.contains("chip__label")).toBe(true);

      unmount();
    });

    it("wraps a number, which reads as text too", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { content: "number" } });

      expect(slot(container, "chip-label")?.textContent).toBe("24");

      unmount();
    });

    it("wraps an empty string, because emptiness is not the question", () => {
      // React wraps `{""}` as well — what decides is that the child is text at all.
      const { container, unmount } = renderVapor(ChipFixture, { props: { label: "" } });

      expect(slot(container, "chip-label")?.textContent).toBe("");

      unmount();
    });

    it("leaves an explicit ChipLabel alone", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { content: "explicit" } });

      expect(slot(container, "chip-label")?.textContent).toBe("Explicit label");

      unmount();
    });

    it("renders exactly one label element, never a nested pair", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { content: "explicit" } });

      expect(container.querySelectorAll("[data-slot='chip-label']")).toHaveLength(1);

      unmount();
    });

    it("leaves markup alongside a label untouched", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { content: "icon" } });
      const chip = slot(container, "chip");

      expect(chip?.querySelector("[data-testid='leading-icon']")).not.toBeNull();
      expect(container.querySelectorAll("[data-slot='chip-label']")).toHaveLength(1);
      // The icon stays a direct child; wrapping it would have moved it into the label.
      expect(chip?.firstElementChild?.getAttribute("data-testid")).toBe("leading-icon");

      unmount();
    });

    it("renders no label at all for a chip with no children", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { content: "none" } });

      expect(container.querySelectorAll("[data-slot='chip-label']")).toHaveLength(0);
      expect(slot(container, "chip")?.textContent).toBe("");

      unmount();
    });

    it("keeps a wrapped label reactive", async () => {
      // The slot is called once and the block it returned is what got wrapped, so the text
      // node inside the label has to still be the one the caller's effect writes to.
      const props = reactive({ label: "Hello" });
      const { container, unmount } = renderVapor(ChipFixture, { props });

      props.label = "Updated";
      await nextTick();

      expect(slot(container, "chip-label")?.textContent).toBe("Updated");

      unmount();
    });
  });

  describe("structure", () => {
    it("renders the root with its data-slot", () => {
      const { container, unmount } = renderVapor(ChipFixture);

      expect(slot(container, "chip")?.tagName).toBe("SPAN");

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class", () => {
      const { container, unmount } = renderVapor(ChipFixture);

      expect(slot(container, "chip")?.classList.contains("chip")).toBe(true);

      unmount();
    });

    it("applies the default color and variant modifiers", () => {
      const { container, unmount } = renderVapor(ChipFixture);
      const root = slot(container, "chip");

      expect(root?.classList.contains("chip--default")).toBe(true);
      expect(root?.classList.contains("chip--secondary")).toBe(true);

      unmount();
    });

    it.each([
      ["color", "danger", "chip--danger"],
      ["size", "lg", "chip--lg"],
      ["variant", "tertiary", "chip--tertiary"],
    ])("applies the %s modifier class", (prop, value, expected) => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { [prop]: value } });

      expect(slot(container, "chip")?.classList.contains(expected)).toBe(true);

      unmount();
    });

    it("merges a caller class onto the root", () => {
      const { container, unmount } = renderVapor(ChipFixture, { props: { class: "uppercase" } });
      const root = slot(container, "chip");

      expect(root?.classList.contains("chip")).toBe(true);
      expect(root?.classList.contains("uppercase")).toBe(true);

      unmount();
    });
  });

  describe("context", () => {
    it("throws when the label renders outside the root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(ChipLabel)).toThrow(/`ChipContext` was consumed outside/);

      warn.mockRestore();
    });
  });
});
