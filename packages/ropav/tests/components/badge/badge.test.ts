import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import { BadgeLabel } from "@/components/badge";

import Fixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

describe("Badge", () => {
  describe("structure", () => {
    it("renders the anchor, badge, and automatic label as spans", () => {
      const { container, unmount } = renderVapor(Fixture);

      expect(slot(container, "badge-anchor")?.tagName).toBe("SPAN");
      expect(slot(container, "badge")?.tagName).toBe("SPAN");
      expect(slot(container, "badge-label")?.tagName).toBe("SPAN");

      unmount();
    });

    it("keeps the badge beside the anchor content", () => {
      const { container, unmount } = renderVapor(Fixture);
      const anchor = slot(container, "badge-anchor");

      expect(anchor?.children).toHaveLength(2);
      expect(anchor?.firstElementChild).toHaveAttribute("data-testid", "anchor-content");
      expect(anchor?.lastElementChild).toHaveAttribute("data-slot", "badge");

      unmount();
    });

    it("forwards arbitrary attributes to each rendered part", () => {
      const { container, unmount } = renderVapor(Fixture, { props: { content: "explicit" } });

      expect(slot(container, "badge-anchor")).toHaveAttribute("data-testid", "anchor");
      expect(slot(container, "badge")).toHaveAttribute("data-testid", "badge");
      expect(slot(container, "badge-label")).toHaveAttribute("data-testid", "label");

      unmount();
    });
  });

  describe("label", () => {
    it("wraps a text-only child in BadgeLabel", () => {
      const { container, unmount } = renderVapor(Fixture);
      const label = slot(container, "badge-label");

      expect(label).toHaveTextContent("5");
      expect(label).toHaveClass("rp-badge__label");

      unmount();
    });

    it("wraps a number, which reaches the DOM as text", () => {
      const { container, unmount } = renderVapor(Fixture, { props: { content: "number" } });

      expect(slot(container, "badge-label")).toHaveTextContent("24");

      unmount();
    });

    it("leaves an explicit BadgeLabel alone", () => {
      const { container, unmount } = renderVapor(Fixture, { props: { content: "explicit" } });

      expect(container.querySelectorAll("[data-slot='badge-label']")).toHaveLength(1);
      expect(slot(container, "badge-label")).toHaveTextContent("Explicit label");

      unmount();
    });

    it("leaves markup unwrapped", () => {
      const { container, unmount } = renderVapor(Fixture, { props: { content: "icon" } });

      expect(slot(container, "badge")?.querySelector("[data-testid='icon']")).not.toBeNull();
      expect(container.querySelectorAll("[data-slot='badge-label']")).toHaveLength(0);

      unmount();
    });

    it("renders no label for a dot badge", () => {
      const { container, unmount } = renderVapor(Fixture, { props: { content: "none" } });

      expect(slot(container, "badge")?.textContent).toBe("");
      expect(container.querySelectorAll("[data-slot='badge-label']")).toHaveLength(0);

      unmount();
    });

    it("keeps an automatically wrapped label reactive", async () => {
      const props = reactive({ label: "5" });
      const { container, unmount } = renderVapor(Fixture, { props });

      props.label = "99+";
      await nextTick();

      expect(slot(container, "badge-label")).toHaveTextContent("99+");

      unmount();
    });
  });

  describe("styling", () => {
    it("applies all default modifier classes", () => {
      const { container, unmount } = renderVapor(Fixture);
      const badge = slot(container, "badge");

      expect(badge).toHaveClass(
        "rp-badge",
        "rp-badge--default",
        "rp-badge--top-right",
        "rp-badge--md",
        "rp-badge--primary",
      );

      unmount();
    });

    it.each([
      ["color", "danger", "rp-badge--danger"],
      ["placement", "bottom-left", "rp-badge--bottom-left"],
      ["size", "lg", "rp-badge--lg"],
      ["variant", "soft", "rp-badge--soft"],
    ])("applies the %s modifier class", (prop, value, expected) => {
      const { container, unmount } = renderVapor(Fixture, { props: { [prop]: value } });

      expect(slot(container, "badge")).toHaveClass(expected);

      unmount();
    });

    it("merges caller classes onto every public part", () => {
      const { container, unmount } = renderVapor(Fixture, {
        props: {
          anchorClass: "isolate",
          class: "uppercase",
          content: "explicit",
          labelClass: "tabular-nums",
        },
      });

      expect(slot(container, "badge-anchor")).toHaveClass("rp-badge-anchor", "isolate");
      expect(slot(container, "badge")).toHaveClass("rp-badge", "uppercase");
      expect(slot(container, "badge-label")).toHaveClass("rp-badge__label", "tabular-nums");

      unmount();
    });

    it("updates variant classes reactively", async () => {
      const props = reactive({ color: "accent" as const, placement: "top-left" as const });
      const { container, unmount } = renderVapor(Fixture, { props });

      expect(slot(container, "badge")).toHaveClass("rp-badge--accent", "rp-badge--top-left");

      Object.assign(props, { color: "success", placement: "bottom-right" });
      await nextTick();

      expect(slot(container, "badge")).toHaveClass("rp-badge--success", "rp-badge--bottom-right");
      expect(slot(container, "badge")).not.toHaveClass("rp-badge--accent", "rp-badge--top-left");

      unmount();
    });
  });

  describe("context", () => {
    it("throws when a label renders outside a badge root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(BadgeLabel)).toThrow(/`BadgeContext` was consumed outside/);

      warn.mockRestore();
    });
  });
});
