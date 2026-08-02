import {describe, expect, it, vi} from "vitest";

import {ChipLabel} from "@/components/chip";

import {renderVapor} from "../../helpers";

import ChipFixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

describe("Chip", () => {
  describe("label shorthand", () => {
    it("renders the label prop through Chip.Label", () => {
      const {container, unmount} = renderVapor(ChipFixture, {props: {label: "Label"}});
      const label = slot(container, "chip-label");

      expect(label?.textContent).toBe("Label");
      expect(label?.classList.contains("chip__label")).toBe(true);

      unmount();
    });

    it("renders slot content instead of the label prop when both are given", () => {
      const {container, unmount} = renderVapor(ChipFixture, {
        props: {label: "Ignored", withSlot: true},
      });

      expect(slot(container, "chip-label")?.textContent).toBe("Explicit label");
      expect(container.textContent).not.toContain("Ignored");

      unmount();
    });

    it("renders exactly one label element, never a nested pair", () => {
      const {container, unmount} = renderVapor(ChipFixture, {
        props: {label: "Ignored", withSlot: true},
      });

      expect(container.querySelectorAll("[data-slot='chip-label']")).toHaveLength(1);

      unmount();
    });
  });

  describe("structure", () => {
    it("renders the root with its data-slot", () => {
      const {container, unmount} = renderVapor(ChipFixture, {props: {label: "Label"}});

      expect(slot(container, "chip")?.tagName).toBe("SPAN");

      unmount();
    });

    it("renders slot content alongside an explicit label", () => {
      const {container, unmount} = renderVapor(ChipFixture, {props: {withSlot: true}});

      expect(container.querySelector("[data-testid='leading-icon']")).not.toBeNull();
      expect(slot(container, "chip-label")).not.toBeNull();

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM block class", () => {
      const {container, unmount} = renderVapor(ChipFixture, {props: {label: "Label"}});

      expect(slot(container, "chip")?.classList.contains("chip")).toBe(true);

      unmount();
    });

    it("applies the default color and variant modifiers", () => {
      const {container, unmount} = renderVapor(ChipFixture, {props: {label: "Label"}});
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
      const {container, unmount} = renderVapor(ChipFixture, {
        props: {label: "Label", [prop]: value},
      });

      expect(slot(container, "chip")?.classList.contains(expected)).toBe(true);

      unmount();
    });

    it("merges a caller class onto the root", () => {
      const {container, unmount} = renderVapor(ChipFixture, {
        props: {class: "uppercase", label: "Label"},
      });
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
