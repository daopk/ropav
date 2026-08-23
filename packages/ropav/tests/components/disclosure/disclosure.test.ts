import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { DisclosureTrigger } from "@/components/disclosure";

import DisclosureFixture from "./fixtures.vue";

const triggerIn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>("[data-slot='disclosure-trigger']");
const contentIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot='disclosure-content']");
const indicatorIn = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot='disclosure-indicator']");
const bareTriggerIn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>("[data-testid='bare-trigger']");

describe("Disclosure", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(container.querySelector("[data-slot='disclosure']")).not.toBeNull();
      expect(container.querySelector("[data-slot='disclosure-heading']")).not.toBeNull();
      expect(triggerIn(container)).not.toBeNull();
      expect(contentIn(container)).not.toBeNull();
      expect(container.querySelector("[data-slot='disclosure-body']")).not.toBeNull();
      expect(indicatorIn(container)).not.toBeNull();

      unmount();
    });

    it("renders the BEM classes on each part", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(container.querySelector("[data-slot='disclosure']")).toHaveClass("disclosure");
      expect(container.querySelector("[data-slot='disclosure-heading']")).toHaveClass(
        "disclosure__heading",
      );
      expect(triggerIn(container)).toHaveClass("disclosure__trigger");
      expect(contentIn(container)).toHaveClass("disclosure__content");
      expect(indicatorIn(container)).toHaveClass("disclosure__indicator");

      unmount();
    });

    it("renders the trigger as a native button of type button", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const trigger = triggerIn(container);

      expect(trigger?.tagName).toBe("BUTTON");
      expect(trigger?.type).toBe("button");

      unmount();
    });

    it("renders the heading as an h3", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(container.querySelector("[data-slot='disclosure-heading']")?.tagName).toBe("H3");

      unmount();
    });

    it("wraps the body content in the inner body element", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const body = container.querySelector("[data-slot='disclosure-body']");

      expect(body).toHaveClass("disclosure__body");
      expect(body?.firstElementChild).toHaveClass("disclosure__body-inner");

      unmount();
    });
  });

  describe("aria wiring", () => {
    it("points aria-controls at the panel it owns", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(triggerIn(container)?.getAttribute("aria-controls")).toBe(contentIn(container)?.id);
      expect(contentIn(container)?.id).toBeTruthy();

      unmount();
    });

    it("points aria-labelledby back at the trigger", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(contentIn(container)?.getAttribute("aria-labelledby")).toBe(triggerIn(container)?.id);
      expect(triggerIn(container)?.id).toBeTruthy();

      unmount();
    });

    it("declares the panel role", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(contentIn(container)?.getAttribute("role")).toBe("group");

      unmount();
    });

    it("prefixes the part ids with the id it is given, and keeps it off the DOM", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, { props: { id: "preview" } });

      expect(triggerIn(container)?.id).toBe("preview-trigger");
      expect(contentIn(container)?.id).toBe("preview-panel");
      // The id names the disclosure to its group; it is not an element id of its own, so it
      // cannot collide with something the consumer ids for itself.
      expect(container.querySelector("[data-slot='disclosure']")?.id).toBe("");

      unmount();
    });
  });

  describe("expansion", () => {
    it("expands on click and collapses again", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const trigger = triggerIn(container);

      expect(trigger?.getAttribute("aria-expanded")).toBe("false");

      trigger?.click();
      await nextTick();
      expect(trigger?.getAttribute("aria-expanded")).toBe("true");

      trigger?.click();
      await nextTick();
      expect(trigger?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("starts expanded with defaultExpanded", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { defaultExpanded: true },
      });

      expect(triggerIn(container)?.getAttribute("aria-expanded")).toBe("true");
      expect(contentIn(container)?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });

    it("emits expandedChange with the next state", async () => {
      const onExpandedChange = vi.fn();
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { onExpandedChange },
      });

      triggerIn(container)?.click();
      await nextTick();

      expect(onExpandedChange).toHaveBeenCalledWith(true);

      unmount();
    });

    it("honours a controlled isExpanded", async () => {
      const onExpandedChange = vi.fn();
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { isExpanded: false, onExpandedChange },
      });

      triggerIn(container)?.click();
      await nextTick();

      // Controlled: the caller owns the value, so the panel does not move on its own.
      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(triggerIn(container)?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("reflects the expanded state on the root", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const root = container.querySelector("[data-slot='disclosure']");

      expect(root).not.toHaveAttribute("data-expanded");

      triggerIn(container)?.click();
      await nextTick();

      expect(root).toHaveAttribute("data-expanded", "true");

      unmount();
    });
  });

  describe("collapsed panel", () => {
    it("keeps the panel out of the tab order and the a11y tree", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const content = contentIn(container);

      // `until-found` rather than plain hidden, so find-in-page can still reveal it.
      expect(content?.getAttribute("hidden")).toBe("until-found");
      expect(content?.getAttribute("aria-hidden")).toBe("true");

      unmount();
    });

    it("sets the panel height variable to zero while collapsed", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(contentIn(container)?.style.getPropertyValue("--disclosure-panel-height")).toBe("0px");

      unmount();
    });

    it("reveals the panel and releases its height when expanded", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      triggerIn(container)?.click();
      await nextTick();

      const content = contentIn(container);

      expect(content?.hasAttribute("hidden")).toBe(false);
      expect(content?.getAttribute("aria-hidden")).toBe("false");
      expect(content?.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");

      unmount();
    });

    it("syncs the state when find-in-page reveals the panel", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const content = contentIn(container)!;

      content.dispatchEvent(new Event("beforematch", { bubbles: true }));
      await nextTick();

      expect(triggerIn(container)?.getAttribute("aria-expanded")).toBe("true");

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables the trigger", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { isDisabled: true },
      });

      expect(triggerIn(container)?.disabled).toBe(true);
      expect(triggerIn(container)).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("does not expand while disabled", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { isDisabled: true },
      });

      triggerIn(container)?.click();
      await nextTick();

      expect(triggerIn(container)?.getAttribute("aria-expanded")).toBe("false");

      unmount();
    });

    it("marks the root with data-disabled", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { isDisabled: true },
      });

      expect(container.querySelector("[data-slot='disclosure']")).toHaveAttribute(
        "data-disabled",
        "true",
      );

      unmount();
    });

    it("drops the tab index of a disabled trigger, so it is not reachable at all", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { isDisabled: true },
      });

      expect(triggerIn(container)?.hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("tab order", () => {
    it("renders an explicit tab index on the trigger", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(triggerIn(container)?.getAttribute("tabindex")).toBe("0");

      unmount();
    });
  });

  describe("indicator", () => {
    it("is the chevron itself when no icon is passed", () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      // The icon carries the class rather than sitting inside a wrapper, so the `svg` selector
      // the button stylesheet reaches icons through still matches it.
      expect(indicatorIn(container)?.tagName).toBe("svg");
      expect(indicatorIn(container)).toHaveClass("disclosure__indicator");

      unmount();
    });

    it("wraps a custom icon passed through the slot", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { customIndicator: true },
      });
      const indicator = indicatorIn(container);

      expect(indicator?.tagName).toBe("SPAN");
      expect(indicator?.querySelector("[data-testid='custom-indicator']")).not.toBeNull();

      unmount();
    });

    it("reflects the expanded state, which is what rotates it", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);

      expect(indicatorIn(container)).not.toHaveAttribute("data-expanded");

      triggerIn(container)?.click();
      await nextTick();

      expect(indicatorIn(container)).toHaveAttribute("data-expanded", "true");

      unmount();
    });
  });

  describe("interaction states", () => {
    it("reports hover, which the stylesheet keys on", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const trigger = triggerIn(container)!;

      trigger.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
      await nextTick();

      expect(trigger).toHaveAttribute("data-hovered", "true");

      trigger.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
      await nextTick();

      expect(trigger).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("reports focus, which is the only path left for the focus ring", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture);
      const trigger = triggerIn(container)!;

      trigger.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(trigger).toHaveAttribute("data-focused", "true");

      unmount();
    });
  });

  describe("a bare button as the trigger", () => {
    it("wires the aria attributes onto it", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { bareTrigger: true, id: "preview" },
      });
      const trigger = bareTriggerIn(container);

      expect(trigger?.id).toBe("preview-trigger");
      expect(trigger?.getAttribute("aria-expanded")).toBe("false");
      expect(trigger?.getAttribute("aria-controls")).toBe(contentIn(container)?.id);

      unmount();
    });

    it("toggles the disclosure when pressed", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { bareTrigger: true },
      });
      const trigger = bareTriggerIn(container)!;

      trigger.click();
      await nextTick();

      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(contentIn(container)?.hasAttribute("hidden")).toBe(false);

      unmount();
    });

    it("is disabled along with the disclosure", () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { bareTrigger: true, isDisabled: true },
      });

      expect(bareTriggerIn(container)?.disabled).toBe(true);

      unmount();
    });

    it("leaves a button inside the panel an ordinary button", async () => {
      const { container, unmount } = renderVapor(DisclosureFixture, {
        props: { bareTrigger: true, defaultExpanded: true },
      });
      const bodyButton = container.querySelector<HTMLButtonElement>("[data-testid='body-button']")!;

      expect(bodyButton.hasAttribute("aria-expanded")).toBe(false);

      bodyButton.click();
      await nextTick();

      // The panel press is shadowed inside the content, so this does not collapse it.
      expect(contentIn(container)?.hasAttribute("hidden")).toBe(false);

      unmount();
    });
  });

  describe("context", () => {
    it("throws when a part renders outside the root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(DisclosureTrigger)).toThrow(
        /`DisclosureContext` was consumed outside/,
      );

      warn.mockRestore();
    });
  });
});
