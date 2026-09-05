import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { setInteractionModality } from "@/composables/use-interaction-states";
import { resetTooltipWarmup } from "@/composables/use-tooltip-trigger-state";

import TooltipFixture from "./fixtures.vue";

/**
 * Rendered through a register, so a case that fails before unmounting still gets cleaned up.
 *
 * The tooltip teleports outside its own container, so a leftover mount leaves a second trigger and
 * a second tooltip in the document — and every later case fails on "found multiple elements"
 * instead of on whatever it was testing. One failure should stay one failure.
 */
const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(TooltipFixture, { props });

  mounted.push(result);

  return result;
};

const POINTER = { bubbles: true, pointerId: 1, pointerType: "mouse" } as const;

const hoverStart = (element: Element, pointerType = "mouse") => {
  element.dispatchEvent(new PointerEvent("pointerenter", { ...POINTER, pointerType }));
};

const hoverEnd = (element: Element, pointerType = "mouse") => {
  element.dispatchEvent(new PointerEvent("pointerleave", { ...POINTER, pointerType }));
};

const key = (element: Element, name: string) => {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: name }));
};

/**
 * The tooltip is teleported a flush after it decides to render, and its position lands the flush
 * after that.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

/** Hover the trigger and wait out the delay, which is how a tooltip normally arrives. */
const open = async (trigger: Element, delay = 1500) => {
  hoverStart(trigger);
  vi.advanceTimersByTime(delay);
  await settle();
};

const slot = (name: string) => document.body.querySelector(`[data-slot="${name}"]`);

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // The modality is page-wide, so each case states the one it needs rather than inheriting it.
    setInteractionModality("pointer");
  });

  afterEach(() => {
    while (mounted.length > 0) {
      try {
        mounted.pop()!.unmount();
      } catch {
        // Already unmounted by the case itself, which is the normal path.
      }
    }

    vi.useRealTimers();
    // The registry and both global timers outlive every component, so a case that left a tooltip
    // warm would make the next one open with no delay and read as a bug there instead.
    resetTooltipWarmup();
    setInteractionModality("keyboard");
  });

  describe("structure", () => {
    it("renders nothing but the trigger while closed", () => {
      const result = render();

      expect(result.screen.getByRole("button", { name: "Open tooltip" })).toBeTruthy();
      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("renders the tooltip outside the app root", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const tooltip = result.screen.getByRole("tooltip");

      // Teleported, so the app's own subtree cannot see it — which is why every query here goes
      // through the document rather than the container.
      expect(result.container.querySelector("[role=tooltip]")).toBeNull();
      expect(tooltip).toBeTruthy();
      // No `data-slot` of its own, matching both React and the popover: the role is the handle,
      // and a marker neither framework emits would be an extra attribute in the shared contract.
      expect(tooltip.hasAttribute("data-slot")).toBe(false);

      result.unmount();
    });

    it("carries the block class", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      expect(result.screen.getByRole("tooltip").classList.contains("rp-tooltip")).toBe(true);

      result.unmount();
    });

    it("takes the tooltip away when it closes", async () => {
      const trigger = render();
      const button = trigger.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);
      expect(trigger.screen.queryByRole("tooltip")).toBeTruthy();

      hoverEnd(button);
      vi.advanceTimersByTime(500);
      await settle();

      expect(trigger.screen.queryByRole("tooltip")).toBeNull();

      trigger.unmount();
    });
  });

  describe("labelling", () => {
    it("describes the trigger with the tooltip only while it is open", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      expect(button.getAttribute("aria-describedby")).toBeNull();

      await open(button);

      const tooltip = result.screen.getByRole("tooltip");

      expect(tooltip.id).toBeTruthy();
      // An idref to an element that is not rendered is worse than none: a screen reader announces
      // nothing and the user has no way to tell.
      expect(button.getAttribute("aria-describedby")).toBe(tooltip.id);

      hoverEnd(button);
      vi.advanceTimersByTime(500);
      await settle();

      expect(button.getAttribute("aria-describedby")).toBeNull();

      result.unmount();
    });

    it("describes rather than names, so the trigger keeps its own label", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);

      // A tooltip is extra information about the control, not the control's name — `aria-label`
      // would replace the visible text a speech-control user reads out.
      expect(button.getAttribute("aria-labelledby")).toBeNull();
      expect(button.getAttribute("aria-label")).toBeNull();

      result.unmount();
    });
  });

  describe("hover", () => {
    it("waits out the delay", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      hoverStart(button);
      vi.advanceTimersByTime(1499);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      vi.advanceTimersByTime(1);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });

    it("takes the delay from the prop", async () => {
      const result = render({ delay: 100 });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      hoverStart(button);
      vi.advanceTimersByTime(100);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });

    it("ignores a touch", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      hoverStart(button, "touch");
      vi.advanceTimersByTime(3000);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("stays open while the pointer is on the tooltip itself", async () => {
      const result = render({ closeDelay: 500 });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);

      const tooltip = result.screen.getByRole("tooltip");

      hoverEnd(button);
      tooltip.dispatchEvent(new PointerEvent("pointerenter", POINTER));
      vi.advanceTimersByTime(1000);
      await settle();

      // The gap between trigger and tooltip is small enough that a pointer travelling past clips
      // the tooltip, and closing on that reads as the label flinching away.
      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });

    it("does nothing while disabled", async () => {
      const result = render({ isDisabled: true });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      hoverStart(button);
      vi.advanceTimersByTime(3000);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("does nothing when it only opens on focus", async () => {
      const result = render({ trigger: "focus" });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      hoverStart(button);
      vi.advanceTimersByTime(3000);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });
  });

  describe("keyboard", () => {
    it("opens at once on keyboard focus", async () => {
      setInteractionModality("keyboard");

      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      button.dispatchEvent(new FocusEvent("focus"));
      await settle();

      // No delay: a user who tabbed here asked for the label deliberately.
      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });

    it("ignores focus that arrived from a press", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      button.dispatchEvent(new FocusEvent("focus"));
      vi.advanceTimersByTime(3000);
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("closes on Escape", async () => {
      const result = render();
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);

      key(button, "Escape");
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("closes at once when the trigger is pressed", async () => {
      const result = render({ closeDelay: 500 });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);

      button.dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      // Instantly, not after the close delay: the tooltip would otherwise sit over whatever the
      // press opened.
      expect(result.screen.queryByRole("tooltip")).toBeNull();

      result.unmount();
    });

    it("stays open through a press when asked to", async () => {
      const result = render({ shouldCloseOnPress: false });
      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      await open(button);

      button.dispatchEvent(new PointerEvent("pointerdown", POINTER));
      await settle();

      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });
  });

  describe("trigger part", () => {
    it("exposes a focusable button role for markup that is not focusable", async () => {
      const result = render({ withCustomTrigger: true });
      const trigger = slot("tooltip-trigger")!;

      expect(trigger.getAttribute("role")).toBe("button");
      expect(trigger.getAttribute("tabindex")).toBe("0");
      expect(trigger.classList.contains("rp-tooltip__trigger")).toBe(true);

      await open(trigger);
      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });

    it("reports its own hover and focus state", async () => {
      setInteractionModality("keyboard");

      const result = render({ withCustomTrigger: true });
      const trigger = slot("tooltip-trigger")!;

      trigger.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      // The stylesheet keys the ring on the attribute, and a `div` has no pseudo-class branch it
      // could fall back to.
      expect(trigger.getAttribute("data-focus-visible")).toBe("true");

      trigger.dispatchEvent(new FocusEvent("blur"));
      await nextTick();

      expect(trigger.getAttribute("data-focus-visible")).toBeNull();

      result.unmount();
    });
  });

  describe("arrow", () => {
    it("renders a default arrow carrying the slot the stylesheet keys", async () => {
      const result = render({ defaultOpen: true, withArrow: true });

      await settle();

      const group = slot("tooltip-arrow");

      expect(group).toBeTruthy();
      expect(slot("overlay-arrow")).toBeTruthy();
      expect(group!.getAttribute("data-placement")).toBe("top");

      result.unmount();
    });

    it("renders a custom arrow untouched", async () => {
      const result = render({ defaultOpen: true, withArrow: true, withCustomArrow: true });

      await settle();

      expect(result.screen.getByTestId("custom-arrow")).toBeTruthy();
      // Vapor renders a slot as it is, so an arrow supplied through it has to carry the slot
      // attribute itself.
      expect(slot("overlay-arrow")).toBeNull();

      result.unmount();
    });

    it("renders no arrow group without one asked for", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      expect(slot("tooltip-arrow")).toBeNull();

      result.unmount();
    });
  });

  describe("placement", () => {
    it("reports the side it was placed on", async () => {
      const result = render({ defaultOpen: true, shouldFlip: false });

      await settle();

      // The default, which differs from a popover's: a tooltip sits above its trigger.
      expect(result.screen.getByRole("tooltip").getAttribute("data-placement")).toBe("top");

      result.unmount();
    });

    it("takes the placement from the prop", async () => {
      const result = render({ defaultOpen: true, placement: "bottom", shouldFlip: false });

      await settle();

      expect(result.screen.getByRole("tooltip").getAttribute("data-placement")).toBe("bottom");

      result.unmount();
    });
  });

  describe("animation state", () => {
    it("reports entry as a string rather than an empty attribute", async () => {
      const result = render({ defaultOpen: true });

      await settle();

      const entering = result.screen.getByRole("tooltip").getAttribute("data-entering");

      // The stylesheet matches `[data-entering="true"]`, so an empty attribute would apply nothing
      // while still looking present in a snapshot.
      expect(entering === null || entering === "true").toBe(true);

      result.unmount();
    });
  });

  describe("controlled", () => {
    it("reports the change rather than closing itself", async () => {
      const changes: boolean[] = [];
      const result = render({
        isOpen: true,
        onOpenChange: (isOpen: boolean) => changes.push(isOpen),
      });

      await settle();

      const button = result.screen.getByRole("button", { name: "Open tooltip" });

      key(button, "Escape");
      await settle();

      expect(changes).toEqual([false]);
      // Held open by the caller, so it stays.
      expect(result.screen.queryByRole("tooltip")).toBeTruthy();

      result.unmount();
    });
  });
});
