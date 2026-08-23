import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {AlertContent, AlertDescription, AlertIndicator, AlertTitle} from "@/components/alert";
import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "@/components/icons";

import Fixture from "./fixtures.vue";

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot='${name}']`);

const glyphPath = (component: Parameters<typeof renderVapor>[0]) => {
  const result = renderVapor(component);
  const path = result.container.querySelector("path")?.getAttribute("d");

  result.unmount();

  return path;
};

describe("Alert", () => {
  describe("structure", () => {
    it("renders every compound part with the React element and data-slot", () => {
      const {container, unmount} = renderVapor(Fixture);

      expect(slot(container, "alert-root")?.tagName).toBe("DIV");
      expect(slot(container, "alert-indicator")?.tagName).toBe("DIV");
      expect(slot(container, "alert-content")?.tagName).toBe("DIV");
      expect(slot(container, "alert-title")?.tagName).toBe("P");
      expect(slot(container, "alert-description")?.tagName).toBe("SPAN");

      unmount();
    });

    it("keeps the indicator beside the content", () => {
      const {container, unmount} = renderVapor(Fixture);
      const root = slot(container, "alert-root");

      expect(root?.children).toHaveLength(2);
      expect(root?.firstElementChild).toHaveAttribute("data-slot", "alert-indicator");
      expect(root?.lastElementChild).toHaveAttribute("data-slot", "alert-content");

      unmount();
    });

    it("forwards arbitrary attributes to every part", () => {
      const {container, unmount} = renderVapor(Fixture);

      expect(slot(container, "alert-root")).toHaveAttribute("data-testid", "root");
      expect(slot(container, "alert-indicator")).toHaveAttribute("data-testid", "indicator");
      expect(slot(container, "alert-content")).toHaveAttribute("data-testid", "content");
      expect(slot(container, "alert-title")).toHaveAttribute("data-testid", "title");
      expect(slot(container, "alert-description")).toHaveAttribute("data-testid", "description");

      unmount();
    });
  });

  describe("indicator", () => {
    it.each([
      [undefined, InfoIcon],
      ["default", InfoIcon],
      ["accent", InfoIcon],
      ["success", SuccessIcon],
      ["warning", WarningIcon],
      ["danger", DangerIcon],
    ] as const)("renders the matching default icon for status %s", (status, expectedIcon) => {
      const {container, unmount} = renderVapor(Fixture, {props: {status}});
      const icon = slot(container, "alert-default-icon");

      expect(icon?.tagName).toBe("svg");
      expect(icon?.querySelector("path")?.getAttribute("d")).toBe(glyphPath(expectedIcon));

      unmount();
    });

    it("makes the default icon decorative", () => {
      const {container, unmount} = renderVapor(Fixture);
      const icon = slot(container, "alert-default-icon");

      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveAttribute("role", "presentation");
      expect(icon).toHaveAttribute("height", "16");
      expect(icon).toHaveAttribute("width", "16");

      unmount();
    });

    it("renders caller content instead of the default icon", () => {
      const {container, unmount} = renderVapor(Fixture, {props: {customIndicator: true}});

      expect(container.querySelector("[data-testid='custom-indicator']")).not.toBeNull();
      expect(slot(container, "alert-default-icon")).toBeNull();

      unmount();
    });

    // React answers this shape with nothing: it reads `children ?? getDefaultIcon()`, so a
    // condition that is false is still children. A `<slot>` fallback would run here instead,
    // which is why the branch is taken on whether the slot was handed over at all.
    it("renders nothing when the caller declares the slot but it yields no content", () => {
      const {container, unmount} = renderVapor(Fixture, {props: {emptyIndicator: true}});
      const indicator = slot(container, "alert-indicator");

      expect(indicator).not.toBeNull();
      expect(slot(container, "alert-default-icon")).toBeNull();
      expect(indicator?.querySelector("svg")).toBeNull();
      expect(indicator?.textContent?.trim()).toBe("");

      unmount();
    });
  });

  describe("styling", () => {
    it("applies the default status and every BEM element class", () => {
      const {container, unmount} = renderVapor(Fixture);

      expect(slot(container, "alert-root")).toHaveClass("alert", "alert--default");
      expect(slot(container, "alert-indicator")).toHaveClass("alert__indicator");
      expect(slot(container, "alert-content")).toHaveClass("alert__content");
      expect(slot(container, "alert-title")).toHaveClass("alert__title");
      expect(slot(container, "alert-description")).toHaveClass("alert__description");

      unmount();
    });

    it.each(["default", "accent", "success", "warning", "danger"] as const)(
      "applies the %s status modifier",
      (status) => {
        const {container, unmount} = renderVapor(Fixture, {props: {status}});

        expect(slot(container, "alert-root")).toHaveClass(`alert--${status}`);

        unmount();
      },
    );

    it("merges caller classes onto every public part", () => {
      const {container, unmount} = renderVapor(Fixture, {
        props: {
          class: "p-2",
          contentClass: "gap-1",
          descriptionClass: "text-sm",
          indicatorClass: "shrink-0",
          titleClass: "font-bold",
        },
      });

      expect(slot(container, "alert-root")).toHaveClass("alert", "p-2");
      expect(slot(container, "alert-indicator")).toHaveClass("alert__indicator", "shrink-0");
      expect(slot(container, "alert-content")).toHaveClass("alert__content", "gap-1");
      expect(slot(container, "alert-title")).toHaveClass("alert__title", "font-bold");
      expect(slot(container, "alert-description")).toHaveClass("alert__description", "text-sm");

      unmount();
    });

    it("updates the status modifier and default icon reactively", async () => {
      const props = reactive({status: "accent" as const});
      const {container, unmount} = renderVapor(Fixture, {props});

      expect(slot(container, "alert-root")).toHaveClass("alert--accent");
      expect(slot(container, "alert-default-icon")?.querySelector("path")?.getAttribute("d")).toBe(
        glyphPath(InfoIcon),
      );

      Object.assign(props, {status: "success"});
      await nextTick();

      expect(slot(container, "alert-root")).toHaveClass("alert--success");
      expect(slot(container, "alert-root")).not.toHaveClass("alert--accent");
      expect(slot(container, "alert-default-icon")?.querySelector("path")?.getAttribute("d")).toBe(
        glyphPath(SuccessIcon),
      );

      unmount();
    });
  });

  describe("context", () => {
    it.each([
      ["Indicator", AlertIndicator],
      ["Content", AlertContent],
      ["Title", AlertTitle],
      ["Description", AlertDescription],
    ])("rejects %s rendered outside the root", (_name, component) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(component)).toThrow(/`AlertContext` was consumed outside/);

      warn.mockRestore();
    });
  });
});
