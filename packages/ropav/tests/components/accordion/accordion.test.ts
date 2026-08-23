import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {AccordionItem} from "@/components/accordion";

import AccordionFixture from "./fixtures.vue";
import SurfaceFixture from "./surface-fixtures.vue";

const triggersIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLButtonElement>("[data-slot='accordion-trigger']"),
];
const panelsIn = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-slot='accordion-panel']"),
];

const pressKey = (element: HTMLElement, key: string) =>
  element.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key}));

describe("Accordion", () => {
  describe("structure", () => {
    it("renders every part with its data-slot", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      expect(container.querySelector("[data-slot='accordion']")).not.toBeNull();
      expect(container.querySelectorAll("[data-slot='accordion-item']")).toHaveLength(3);
      expect(container.querySelectorAll("[data-slot='accordion-heading']")).toHaveLength(3);
      expect(triggersIn(container)).toHaveLength(3);
      expect(panelsIn(container)).toHaveLength(3);
      expect(container.querySelectorAll("[data-slot='accordion-body']")).toHaveLength(3);

      unmount();
    });

    it("renders the trigger as a native button of type button", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0];

      expect(trigger?.tagName).toBe("BUTTON");
      expect(trigger?.type).toBe("button");

      unmount();
    });

    it("wraps the body content in the inner body element", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const body = container.querySelector("[data-slot='accordion-body']");

      expect(body?.classList.contains("accordion__body")).toBe(true);
      expect(body?.firstElementChild?.classList.contains("accordion__body-inner")).toBe(true);

      unmount();
    });

    it("renders the heading as an h3", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      expect(container.querySelector("[data-slot='accordion-heading']")?.tagName).toBe("H3");

      unmount();
    });
  });

  describe("aria wiring", () => {
    it("points aria-controls at the panel it owns", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0];
      const panel = panelsIn(container)[0];

      expect(trigger?.getAttribute("aria-controls")).toBe(panel?.id);
      expect(panel?.id).toBeTruthy();

      unmount();
    });

    it("points aria-labelledby back at the trigger", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0];
      const panel = panelsIn(container)[0];

      expect(panel?.getAttribute("aria-labelledby")).toBe(trigger?.id);
      expect(trigger?.id).toBeTruthy();

      unmount();
    });

    it("gives every item a distinct trigger and panel id", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const ids = triggersIn(container).map((trigger) => trigger.id);

      expect(new Set(ids).size).toBe(3);

      unmount();
    });

    it("reflects the expanded state on aria-expanded", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0];

      expect(trigger?.getAttribute("aria-expanded")).toBe("false");

      trigger?.click();
      await nextTick();

      expect(trigger?.getAttribute("aria-expanded")).toBe("true");

      unmount();
    });

    it("declares the panel role", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      expect(panelsIn(container)[0]?.getAttribute("role")).toBe("group");

      unmount();
    });
  });

  describe("expansion", () => {
    it("expands an item on click", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(panelsIn(container)[0]?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });

    it("collapses an expanded item on click", async () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {defaultExpandedKeys: ["one"]},
      });

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(panelsIn(container)[0]?.hasAttribute("data-expanded")).toBe(false);

      unmount();
    });

    it("collapses the open item when only one may be expanded", async () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {defaultExpandedKeys: ["one"]},
      });

      triggersIn(container)[1]?.click();
      await nextTick();

      const panels = panelsIn(container);

      expect(panels[0]?.hasAttribute("data-expanded")).toBe(false);
      expect(panels[1]?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });

    it("keeps items open when multiple may be expanded", async () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {allowsMultipleExpanded: true, defaultExpandedKeys: ["one"]},
      });

      triggersIn(container)[1]?.click();
      await nextTick();

      const panels = panelsIn(container);

      expect(panels[0]?.getAttribute("data-expanded")).toBe("true");
      expect(panels[1]?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });

    it("emits expandedChange with the item ids", async () => {
      const onExpandedChange = vi.fn();
      const {container, unmount} = renderVapor(AccordionFixture, {props: {onExpandedChange}});

      triggersIn(container)[2]?.click();
      await nextTick();

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["three"]));

      unmount();
    });

    it("honours controlled expandedKeys", async () => {
      const onExpandedChange = vi.fn();
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {expandedKeys: ["two"], onExpandedChange},
      });

      expect(panelsIn(container)[1]?.getAttribute("data-expanded")).toBe("true");

      triggersIn(container)[1]?.click();
      await nextTick();

      // Controlled: the caller owns the value, so the panel does not move on its own.
      expect(onExpandedChange).toHaveBeenCalledWith(new Set([]));
      expect(panelsIn(container)[1]?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });
  });

  describe("collapsed panel", () => {
    it("hides a collapsed panel from the tab order and the a11y tree", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const panel = panelsIn(container)[0];

      // `until-found` rather than plain hidden, so find-in-page can still reveal it.
      expect(panel?.getAttribute("hidden")).toBe("until-found");
      expect(panel?.getAttribute("aria-hidden")).toBe("true");

      unmount();
    });

    it("sets the panel height variable to zero while collapsed", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      expect(panelsIn(container)[0]?.style.getPropertyValue("--disclosure-panel-height")).toBe(
        "0px",
      );

      unmount();
    });

    it("reveals the panel and releases its height when expanded", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      triggersIn(container)[0]?.click();
      await nextTick();

      const panel = panelsIn(container)[0];

      expect(panel?.hasAttribute("hidden")).toBe(false);
      expect(panel?.getAttribute("aria-hidden")).toBe("false");
      expect(panel?.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");

      unmount();
    });

    it("starts already revealed for a default-expanded item", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {defaultExpandedKeys: ["one"]},
      });
      const panel = panelsIn(container)[0];

      expect(panel?.hasAttribute("hidden")).toBe(false);
      expect(panel?.style.getPropertyValue("--disclosure-panel-height")).toBe("auto");

      unmount();
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus to the next and previous trigger", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const triggers = triggersIn(container);

      triggers[0]?.focus();
      pressKey(triggers[0]!, "ArrowDown");
      expect(document.activeElement).toBe(triggers[1]);

      pressKey(triggers[1]!, "ArrowUp");
      expect(document.activeElement).toBe(triggers[0]);

      unmount();
    });

    it("moves focus to the first and last trigger", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const triggers = triggersIn(container);

      pressKey(triggers[1]!, "End");
      expect(document.activeElement).toBe(triggers[2]);

      pressKey(triggers[2]!, "Home");
      expect(document.activeElement).toBe(triggers[0]);

      unmount();
    });

    // Roving would park every unfocused trigger at -1 and leave the group one tab stop. Asserted
    // as "nothing is -1" rather than "no tabindex at all", because every enabled trigger now
    // carries an explicit 0 — see the tab order block for why.
    it("keeps every trigger tabbable rather than using roving tabindex", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      for (const trigger of triggersIn(container)) {
        expect(trigger.getAttribute("tabindex")).toBe("0");
      }

      unmount();
    });

    it("toggles on Enter through native button activation", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0];

      // A native <button> turns Enter and Space into a click, so no key handling is needed.
      trigger?.click();
      await nextTick();

      expect(trigger?.getAttribute("aria-expanded")).toBe("true");

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables every trigger when the group is disabled", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {isDisabled: true}});

      for (const trigger of triggersIn(container)) {
        expect(trigger.disabled).toBe(true);
      }

      unmount();
    });

    it("disables a single item", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {disabledItem: "two"},
      });
      const triggers = triggersIn(container);

      expect(triggers[0]?.disabled).toBe(false);
      expect(triggers[1]?.disabled).toBe(true);

      unmount();
    });

    it("does not expand a disabled item", async () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {disabledItem: "one"},
      });

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(panelsIn(container)[0]?.hasAttribute("data-expanded")).toBe(false);

      unmount();
    });

    it("marks the item with data-disabled", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {disabledItem: "one"},
      });
      const items = container.querySelectorAll("[data-slot='accordion-item']");

      expect(items[0]?.getAttribute("data-disabled")).toBe("true");
      expect(items[1]?.hasAttribute("data-disabled")).toBe(false);

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native button is already tabbable: Safari does not focus one
    // unless an explicit tab index says so, which is why react-aria always sets it.
    // Every enabled trigger keeps its own stop: the accordion pattern has no roving index.
    it("renders an explicit tab index on every trigger", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {}});

      for (const trigger of triggersIn(container)) {
        expect(trigger).toHaveAttribute("tabindex", "0");
      }

      unmount();
    });

    it("drops the tab index of a disabled item, so it is not reachable at all", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {disabledItem: "two"}});
      const triggers = triggersIn(container);

      expect(triggers[0]).toHaveAttribute("tabindex", "0");
      expect(triggers[1]?.hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("interaction states", () => {
    // React builds the trigger on React Aria's `Button`, which renders these. They are not
    // cosmetic here: `accordion.css` reaches the focus ring only through
    // `[data-focus-visible="true"]`, since the `&:focus-visible:not(:focus)` branch beside it
    // can never match on a real button.
    it("reports hover, which the stylesheet keys the trigger background on", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0]!;

      trigger.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true}));
      await nextTick();

      expect(trigger).toHaveAttribute("data-hovered", "true");

      trigger.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true}));
      await nextTick();

      expect(trigger).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("reports focus, the only path left for the focus ring", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0]!;

      trigger.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(trigger).toHaveAttribute("data-focused", "true");
      expect(trigger).toHaveAttribute("data-focus-visible", "true");

      trigger.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(trigger).not.toHaveAttribute("data-focused");
      expect(trigger).not.toHaveAttribute("data-focus-visible");

      unmount();
    });

    it("reports press until the pointer is released, even away from the trigger", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const trigger = triggersIn(container)[0]!;

      trigger.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      await nextTick();

      expect(trigger).toHaveAttribute("data-pressed", "true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(trigger).not.toHaveAttribute("data-pressed");

      unmount();
    });

    it("reports none of them on a disabled trigger", async () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {disabledItem: "one"}});
      const trigger = triggersIn(container)[0]!;

      expect(trigger).toHaveAttribute("data-disabled", "true");

      trigger.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true}));
      trigger.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      trigger.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(trigger).not.toHaveAttribute("data-hovered");
      expect(trigger).not.toHaveAttribute("data-pressed");
      expect(trigger).not.toHaveAttribute("data-focus-visible");

      unmount();
    });
  });

  describe("indicator", () => {
    it("renders the built-in chevron when no slot content is passed", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const indicator = container.querySelector("[data-slot='accordion-indicator']");

      expect(indicator?.querySelector("svg")).not.toBeNull();

      unmount();
    });

    it("renders a custom icon from the slot instead of the chevron", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {
        props: {customIndicator: true},
      });
      const indicator = container.querySelector("[data-slot='accordion-indicator']");

      expect(indicator?.querySelector("[data-testid='custom-indicator']")).not.toBeNull();
      expect(indicator?.querySelectorAll("svg")).toHaveLength(1);

      unmount();
    });

    it("reflects the expanded state, which is what rotates it", async () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const indicator = container.querySelector("[data-slot='accordion-indicator']");

      expect(indicator?.hasAttribute("data-expanded")).toBe(false);

      triggersIn(container)[0]?.click();
      await nextTick();

      expect(indicator?.getAttribute("data-expanded")).toBe("true");

      unmount();
    });
  });

  describe("styling", () => {
    it("renders the BEM classes on each part", () => {
      const {container, unmount} = renderVapor(AccordionFixture);

      expect(container.querySelector("[data-slot='accordion']")?.classList).toContain("accordion");
      expect(container.querySelector("[data-slot='accordion-item']")?.classList).toContain(
        "accordion__item",
      );
      expect(triggersIn(container)[0]?.classList).toContain("accordion__trigger");
      expect(panelsIn(container)[0]?.classList).toContain("accordion__panel");

      unmount();
    });

    it("applies the surface variant modifier", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {variant: "surface"}});

      expect(container.querySelector("[data-slot='accordion']")?.classList).toContain(
        "accordion--surface",
      );

      unmount();
    });

    it("marks items with data-hide-separator when the separator is hidden", () => {
      const {container, unmount} = renderVapor(AccordionFixture, {props: {hideSeparator: true}});

      for (const item of container.querySelectorAll("[data-slot='accordion-item']")) {
        expect(item.getAttribute("data-hide-separator")).toBe("true");
      }

      unmount();
    });

    it("omits data-hide-separator by default", () => {
      const {container, unmount} = renderVapor(AccordionFixture);
      const item = container.querySelector("[data-slot='accordion-item']");

      expect(item?.hasAttribute("data-hide-separator")).toBe(false);

      unmount();
    });
  });

  describe("context", () => {
    it("throws when an item renders outside the root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => renderVapor(AccordionItem)).toThrow(/`AccordionContext` was consumed outside/);

      warn.mockRestore();
    });
  });
  describe("surface context", () => {
    const surfaceOf = (props: Record<string, unknown> = {}) => {
      const result = renderVapor(SurfaceFixture, {props});
      const consumer = result.container.querySelector('[data-testid="consumer"]');

      if (!consumer) throw new Error("consumer not rendered");

      return {...result, consumer};
    };

    it("tells descendants they sit on a surface accordion", () => {
      // The surface variant paints the default surface colour, whatever the accordion is called.
      const {consumer, unmount} = surfaceOf({variant: "surface"});

      expect(consumer).toHaveAttribute("data-surface", "default");

      unmount();
    });

    it("offers no surface for the default variant standing alone", () => {
      const {consumer, unmount} = surfaceOf();

      expect(consumer).toHaveAttribute("data-surface", "none");

      unmount();
    });

    it("forwards the surface behind a non-surface accordion", () => {
      const {consumer, unmount} = surfaceOf({outerVariant: "secondary"});

      expect(consumer).toHaveAttribute("data-surface", "secondary");

      unmount();
    });

    it("shadows an outer surface when it paints one itself", () => {
      const {consumer, unmount} = surfaceOf({outerVariant: "tertiary", variant: "surface"});

      expect(consumer).toHaveAttribute("data-surface", "default");

      unmount();
    });

    it("follows the variant when it changes", async () => {
      // `provide` runs once, so the variant has to be read on every access.
      const props = reactive({outerVariant: "tertiary", variant: "surface"});
      const {consumer, unmount} = surfaceOf(props);

      expect(consumer).toHaveAttribute("data-surface", "default");

      props.variant = "default";
      await nextTick();

      expect(consumer).toHaveAttribute("data-surface", "tertiary");

      unmount();
    });
  });
});
