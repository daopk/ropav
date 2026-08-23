import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

type RenderResult = ReturnType<typeof render>;

/** Wait for the entry or exit animation to finish, so the popover is measured at its final size. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

/**
 * Put the trigger where the popover fits beside it.
 *
 * The test window is narrow, and a trigger in the middle of it leaves no room for the placement
 * that was asked for — correct behaviour, but it hides whether the placement was honoured.
 */
const place = (result: RenderResult) => {
  result.container.style.position = "fixed";
  result.container.style.left = "12px";
  result.container.style.top = "20%";
};

const slot = (name: string) => document.body.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

const slots = (name: string) => [
  ...document.body.querySelectorAll<HTMLElement>(`[data-slot='${name}']`),
];

const open = async () => {
  await userEvent.click(slot("color-picker-trigger"));
  await nextTick();
  await nextTick();
  await nextTick();

  const popover = slot("color-picker-popover");

  await settled(popover);

  return popover;
};

const close = async (popover: HTMLElement) => {
  await userEvent.keyboard("{Escape}");
  await settled(popover);
  await nextTick();
  await nextTick();
};

afterEach(() => {
  /**
   * The page-wide scroll lock and the `inert` marking both live outside the container. A failing
   * test throws before it can close its popover, and a leaked `inert` makes every later press
   * time out instead of failing — so one broken assertion would read as ten broken ones.
   */
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
    if (child.getAttribute("style") === "display: contents;") child.remove();
  }
});

/**
 * The parts of ColorPicker only a real browser can show: the popover has to be laid out before a
 * placement means anything, the shared colour only becomes visible once a gradient is resolved by
 * an engine, and a drag inside the popover has to reach a component that lives in a teleport.
 */
describe("ColorPicker (browser)", () => {
  describe("opening", () => {
    it("opens on a real press and places the popover under the trigger", async () => {
      const result = render({ defaultValue: "#0485F7" });

      place(result);
      await nextTick();

      const popover = await open();

      expect(popover).toHaveAttribute("data-placement", "bottom");

      const trigger = slot("color-picker-trigger").getBoundingClientRect();
      const box = popover.getBoundingClientRect();

      expect(box.top).toBeGreaterThanOrEqual(trigger.bottom);

      await close(popover);
      result.unmount();
    });

    it("opens by keyboard as well as by pointer", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      // Tab walks from whatever holds focus, and the page is shared between tests in browser mode.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      expect(document.activeElement).toBe(slot("color-picker-trigger"));

      await userEvent.keyboard("{Enter}");
      await nextTick();
      await nextTick();
      await nextTick();

      const popover = slot("color-picker-popover");

      expect(popover).not.toBeNull();

      await close(popover);
      result.unmount();
    });

    it("closes on Escape", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();

      await close(popover);

      expect(document.body.querySelector("[data-slot='color-picker-popover']")).toBeNull();

      result.unmount();
    });

    it("moves focus into the dialog and back to the trigger on close", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();

      expect(popover.contains(document.activeElement)).toBe(true);

      await close(popover);

      expect(document.activeElement).toBe(slot("color-picker-trigger"));

      result.unmount();
    });
  });

  describe("the shared colour, painted", () => {
    it("paints the trigger's swatch with the picker's colour", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      expect(getComputedStyle(slot("color-swatch")).backgroundColor).toBe("rgb(4, 133, 247)");

      result.unmount();
    });

    it("resolves the colour area's gradient from the picker's colour", async () => {
      // Only an engine resolves this: the area composes three layers, and the flat one underneath
      // is the picker's hue.
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();
      const { backgroundImage } = getComputedStyle(slot("color-area"));

      expect(backgroundImage).toContain("linear-gradient(to top, rgb(0, 0, 0)");
      expect(getComputedStyle(slot("color-area")).backgroundColor).toBe("rgb(0, 135, 255)");

      await close(popover);
      result.unmount();
    });

    it("puts the slider's thumb where the picker's hue is", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();
      const track = slot("color-slider-track").getBoundingClientRect();
      const thumb = slot("color-slider-thumb").getBoundingClientRect();
      const fraction = (thumb.left + thumb.width / 2 - track.left) / track.width;

      // Hue 208.15 of 360.
      expect(fraction).toBeCloseTo(0.578, 2);

      await close(popover);
      result.unmount();
    });
  });

  describe("driving the colour from inside the popover", () => {
    it("follows a real drag in the colour area", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();
      const area = slot("color-area");
      const box = area.getBoundingClientRect();
      const options = { bubbles: true, button: 0, pointerId: 1, pointerType: "mouse" };

      area.dispatchEvent(
        new PointerEvent("pointerdown", {
          ...options,
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
        }),
      );
      await nextTick();

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          ...options,
          clientX: box.left,
          clientY: box.bottom,
        }),
      );
      await nextTick();

      window.dispatchEvent(new PointerEvent("pointerup", options));
      await nextTick();

      // Bottom left of a saturation × brightness square is black, whatever the hue was.
      expect(getComputedStyle(slots("color-swatch")[0]!).backgroundColor).toBe("rgb(0, 0, 0)");

      await close(popover);
      result.unmount();
    });

    it("follows the keyboard on the slider inside the popover", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();
      const before = getComputedStyle(slots("color-swatch")[0]!).backgroundColor;

      document.body.querySelector<HTMLInputElement>("[data-slot='color-slider'] input")!.focus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      await nextTick();

      expect(getComputedStyle(slots("color-swatch")[0]!).backgroundColor).not.toBe(before);

      await close(popover);
      result.unmount();
    });

    it("updates the trigger from a swatch pressed inside the popover", async () => {
      const result = render({ defaultValue: "#EF4444", withEverything: true });

      await nextTick();

      const popover = await open();

      await userEvent.click(document.body.querySelectorAll<HTMLElement>("[role='option']")[1]!);
      await nextTick();

      expect(getComputedStyle(slots("color-swatch")[0]!).backgroundColor).toBe("rgb(34, 197, 94)");

      await close(popover);
      result.unmount();
    });

    it("stays open while the colour is being changed", async () => {
      // A press inside the dialog must not read as an outside interaction.
      const result = render({ defaultValue: "#EF4444", withEverything: true });

      await nextTick();

      const popover = await open();

      await userEvent.click(document.body.querySelectorAll<HTMLElement>("[role='option']")[1]!);
      await nextTick();

      expect(document.body.querySelector("[data-slot='color-picker-popover']")).not.toBeNull();

      await close(popover);
      result.unmount();
    });
  });

  describe("appearance", () => {
    it("shows a focus ring on the trigger reached by keyboard", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      const trigger = slot("color-picker-trigger");

      expect(trigger).toHaveAttribute("data-focus-visible", "true");
      expect(getComputedStyle(trigger).boxShadow).not.toBe("none");

      result.unmount();
    });

    it("gives the popover the overlay background and its own shadow", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();

      const popover = await open();
      const styles = getComputedStyle(popover);

      expect(styles.boxShadow).not.toBe("none");
      expect(styles.display).toBe("flex");
      expect(styles.flexDirection).toBe("column");

      await close(popover);
      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations while closed", async () => {
      const result = render({ defaultValue: "#0485F7" });

      await nextTick();
      await expectNoA11yViolations(result.container);

      result.unmount();
    });

    it("has no axe violations while open", async () => {
      const result = render({ defaultValue: "#0485F7", withEverything: true });

      await nextTick();

      const popover = await open();

      await expectNoA11yViolations(popover);

      await close(popover);
      result.unmount();
    });
  });
});
