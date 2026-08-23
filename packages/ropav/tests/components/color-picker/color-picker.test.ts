import type { Color } from "@/utils/color-types";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const renderPicker = async (props: Record<string, unknown> = {}) => {
  const rendered = renderVapor(Fixture, { props });

  await nextTick();

  return rendered;
};

/** Parts of an open picker are teleported, so they are looked up on the document. */
const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (name: string) => [
  ...document.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
];

const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

/** A press is three events, not a bare click: the responder tracks the pointer through all of it. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

/**
 * The container is teleported a flush after the popover decides to render, and the dialog inside
 * claims its label a flush after that.
 */
const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const open = async () => {
  press(slot("color-picker-trigger"));
  await settle();
};

const key = (element: Element, name: string) => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: name }),
  );

  return nextTick();
};

/**
 * A test that throws before its `unmount()` leaves a live picker in the page, and every lookup
 * here goes through the document because the popover is teleported — so one failure would report
 * itself again as a cascade of unrelated ones. Cleared between tests instead.
 */
afterEach(() => {
  document.body.replaceChildren();
});

describe("ColorPicker", () => {
  describe("structure", () => {
    it("renders the root and the trigger with their data-slot and BEM class", async () => {
      const { container, unmount } = await renderPicker();

      expect(container.querySelector("[data-slot='color-picker']")).toHaveClass("color-picker");
      expect(slot("color-picker-trigger")).toHaveClass("color-picker__trigger");

      unmount();
    });

    it("keeps the popover out of the document until it is opened", async () => {
      const { unmount } = await renderPicker();

      expect(document.querySelector("[data-slot='color-picker-popover']")).toBeNull();

      await open();

      expect(slot("color-picker-popover")).toHaveClass("color-picker__popover");

      unmount();
    });

    it("makes the popover a dialog named by the trigger", async () => {
      const { unmount } = await renderPicker();

      await open();

      const trigger = slot("color-picker-trigger");
      const popover = slot("color-picker-popover");

      expect(popover).toHaveAttribute("role", "dialog");
      expect(popover).toHaveAttribute("tabindex", "-1");
      expect(popover).toHaveAttribute("aria-labelledby", trigger.id);
      expect(popover).toHaveAttribute("data-trigger", "DialogTrigger");
      expect(trigger).toHaveAttribute("aria-controls", popover.id);

      unmount();
    });

    it("reports the open state on the trigger", async () => {
      const { unmount } = await renderPicker();

      expect(slot("color-picker-trigger")).toHaveAttribute("aria-expanded", "false");

      await open();

      expect(slot("color-picker-trigger")).toHaveAttribute("aria-expanded", "true");

      unmount();
    });

    it("is a real button so it submits nothing by accident", async () => {
      const { unmount } = await renderPicker();

      expect(slot("color-picker-trigger").tagName).toBe("BUTTON");
      expect(slot("color-picker-trigger")).toHaveProperty("type", "button");

      unmount();
    });

    it("lets a caller's class through to tailwind-merge", async () => {
      const { container, unmount } = await renderPicker({ class: "w-40" });

      expect(container.querySelector("[data-slot='color-picker']")).toHaveClass("w-40");

      unmount();
    });

    it("starts open when told to", async () => {
      const { unmount } = await renderPicker({ defaultOpen: true });

      await nextTick();

      expect(slot("color-picker-popover")).not.toBeNull();

      unmount();
    });
  });

  describe("the shared colour", () => {
    it("hands the picker's colour to a swatch that has none", async () => {
      // This is the whole point of the context: the swatch in the trigger shows the value.
      const { unmount } = await renderPicker({ defaultValue: "#0485F7" });

      expect(slot("color-swatch")).toHaveAttribute("aria-label", "vibrant cyan blue");
      expect(slot("color-swatch").style.backgroundColor).toBe("rgb(4, 133, 247)");

      unmount();
    });

    it("lets a swatch's own colour win", async () => {
      const { unmount } = await renderPicker({ defaultValue: "#0485F7", swatchValue: "#FF0000" });

      expect(slot("color-swatch").style.backgroundColor).toBe("rgb(255, 0, 0)");

      unmount();
    });

    it("drives a slider inside the popover", async () => {
      const { unmount } = await renderPicker({ defaultValue: "#0485F7" });

      await open();

      // #0485F7 is hue 208.15 in hsb, which is where the slider's thumb has to sit.
      expect(slot("color-slider-thumb").style.left).toBe("57.77777777777777%");

      unmount();
    });

    it("lets a slider's own value win", async () => {
      const { unmount } = await renderPicker({
        defaultValue: "#0485F7",
        sliderValue: "hsb(0, 100%, 100%)",
      });

      await open();

      expect(slot("color-slider-thumb").style.left).toBe("0%");

      unmount();
    });

    it("drives a colour area inside the popover", async () => {
      const { unmount } = await renderPicker({ defaultValue: "#0485F7" });

      await open();

      const thumb = slot("color-area-thumb");

      // Saturation 98.38%, brightness 96.86% — the same colour, read on two axes.
      expect(thumb.style.left).toBe("98.38%");
      expect(thumb.style.top).toBe("3.1399999999999983%");

      unmount();
    });

    it("drives a swatch picker and a colour field too", async () => {
      const { unmount } = await renderPicker({ defaultValue: "#EF4444", withEverything: true });

      await open();

      const option = document.querySelector<HTMLElement>("[role='option']")!;

      expect(option).toHaveAttribute("data-selected", "true");
      // Selected by slot, not by `input[type='text']`: vapor writes `type` as a property, so an
      // input whose type is already the default carries no `type` attribute to match on.
      const input = document.querySelector<HTMLInputElement>(
        "[data-slot='color-input-group-input']",
      )!;

      expect(input.value).toBe("#EF4444");

      unmount();
    });

    it("lets a field pinned empty stay empty", async () => {
      /**
       * `null` is a value, not the absence of one: an emptied colour field is the caller saying
       * "no colour", and the picker's colour must not fill it back in. This is the case that makes
       * the precedence an explicit `!== undefined` test rather than `??`.
       */
      const { unmount } = await renderPicker({
        defaultValue: "#EF4444",
        withEmptyField: true,
        withEverything: true,
      });

      await open();

      const input = document.querySelector<HTMLInputElement>(
        "[data-slot='color-input-group-input']",
      )!;

      expect(input.value).toBe("");

      unmount();
    });
  });

  describe("changes coming back up", () => {
    it("reports a colour chosen inside the popover", async () => {
      const onChange = vi.fn();
      const { unmount } = await renderPicker({
        defaultValue: "#EF4444",
        onChange,
        withEverything: true,
      });

      await open();

      document.querySelectorAll<HTMLElement>("[role='option']")[1]!.click();
      await nextTick();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]![0] as Color).toString("hex")).toBe("#22C55E");

      unmount();
    });

    it("shows the new colour on the trigger's swatch", async () => {
      const { unmount } = await renderPicker({ defaultValue: "#EF4444", withEverything: true });

      await open();

      document.querySelectorAll<HTMLElement>("[role='option']")[1]!.click();
      await nextTick();

      expect(slots("color-swatch")[0]!.style.backgroundColor).toBe("rgb(34, 197, 94)");

      unmount();
    });

    it("chains a component's own handler rather than replacing the picker's", async () => {
      /**
       * The half that is easiest to port wrong. React merges the two with `chain`, so both run;
       * treating the context as a fallback would make a slider that carries its own `@change`
       * silently cut the picker's update path — the trigger would stop following the slider.
       */
      const onChange = vi.fn();
      const onSliderChange = vi.fn();
      const { unmount } = await renderPicker({
        defaultValue: "#0485F7",
        onChange,
        onSliderChange,
        withSliderChange: true,
      });

      await open();
      await key(slot("color-slider-thumb"), "PageUp");

      expect(onSliderChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      // Hue pages by 15, and #0485F7 is hue 208.15 — snapped to the step, then paged.
      expect((onChange.mock.calls[0]![0] as Color).getChannelValue("hue")).toBe(223);

      unmount();
    });

    it("does not move a controlled colour by itself", async () => {
      const onChange = vi.fn();
      const props = reactive<Record<string, unknown>>({
        onChange,
        value: "#EF4444",
        withEverything: true,
      });
      const { unmount } = await renderPicker(props);

      await open();

      document.querySelectorAll<HTMLElement>("[role='option']")[1]!.click();
      await nextTick();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(slots("color-swatch")[0]!.style.backgroundColor).toBe("rgb(239, 68, 68)");

      unmount();
    });

    it("follows a controlled colour", async () => {
      const props = reactive<Record<string, unknown>>({ value: "#EF4444" });
      const { unmount } = await renderPicker(props);

      expect(slot("color-swatch").style.backgroundColor).toBe("rgb(239, 68, 68)");

      props["value"] = "#22C55E";
      await nextTick();

      expect(slot("color-swatch").style.backgroundColor).toBe("rgb(34, 197, 94)");

      unmount();
    });
  });

  describe("open state", () => {
    it("reports opening and closing", async () => {
      const onOpenChange = vi.fn();
      const { unmount } = await renderPicker({ onOpenChange });

      await open();

      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      unmount();
    });

    it("stays closed when a caller holds it closed", async () => {
      const onOpenChange = vi.fn();
      const { unmount } = await renderPicker({ isOpen: false, onOpenChange });

      await open();

      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(document.querySelector("[data-slot='color-picker-popover']")).toBeNull();

      unmount();
    });

    it("opens when a caller says so", async () => {
      const props = reactive<Record<string, unknown>>({ isOpen: false });
      const { unmount } = await renderPicker(props);

      props["isOpen"] = true;
      await nextTick();
      await nextTick();

      expect(document.querySelector("[data-slot='color-picker-popover']")).not.toBeNull();

      unmount();
    });
  });
});
