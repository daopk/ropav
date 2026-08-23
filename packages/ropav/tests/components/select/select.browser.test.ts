import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import Fixture from "./fixtures.vue";

/**
 * What only a real browser can answer for a select.
 *
 * The stylesheet is the first half: `.select__trigger:has(.select__indicator)` and
 * `min-w-(--trigger-width)` are rules jsdom never applies, and a focus ring drawn with
 * `box-shadow` reads as nothing there. The second half is time and geometry — the entry animation
 * finishing, the popover leaving the DOM after its exit, and where it actually lands next to the
 * trigger. The jsdom clock is frozen and its layout is all zeroes, so none of it is provable there.
 */
const render = (props: Record<string, unknown> = {}) => renderVapor(Fixture, {props});

type RenderResult = ReturnType<typeof render>;

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

const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

/** Wait for the entry animation to finish, so the popover is measured at its settled size. */
const settled = async (popover: HTMLElement) => {
  await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const triggerOf = (result: RenderResult) =>
  result.container.querySelector<HTMLElement>('[data-slot="select-trigger"]')!;

const popoverOf = () => document.body.querySelector<HTMLElement>('[data-slot="select-popover"]');

const open = async (result: RenderResult) => {
  press(triggerOf(result));
  await nextTick();
  await nextTick();

  const popover = popoverOf()!;

  await settled(popover);

  return popover;
};

const cleanups: Array<() => void> = [];

afterEach(async () => {
  while (cleanups.length > 0) cleanups.pop()?.();
  await nextTick();
});

const mount = (props: Record<string, unknown> = {}) => {
  const result = render(props);

  cleanups.push(result.unmount);

  return result;
};

describe("Select (browser)", () => {
  describe("the stylesheet", () => {
    it("makes room in the trigger for the indicator", async () => {
      const withIndicator = mount();

      await nextTick();

      // `.select__trigger:has(.select__indicator)` — a `:has()` rule jsdom never evaluates.
      expect(getComputedStyle(triggerOf(withIndicator)).paddingInlineEnd).toBe("28px");
    });

    it("turns the indicator over while the popover is open", async () => {
      const result = mount();

      await nextTick();

      const indicator = result.container.querySelector<HTMLElement>(
        '[data-slot="select-default-indicator"]',
      )!;

      expect(getComputedStyle(indicator).rotate).toBe("none");

      await open(result);

      expect(getComputedStyle(indicator).rotate).toBe("180deg");
    });

    it("greys the placeholder and not a real value", async () => {
      const empty = mount();
      const chosen = mount({defaultValue: "texas"});

      await nextTick();

      const colourOf = (result: RenderResult) =>
        getComputedStyle(result.container.querySelector<HTMLElement>('[data-slot="select-value"]')!)
          .color;

      expect(colourOf(empty)).not.toBe(colourOf(chosen));
    });

    it("draws a focus ring the trigger can actually be seen to have", async () => {
      const result = mount();

      await nextTick();

      const trigger = triggerOf(result);
      const resting = getComputedStyle(trigger).boxShadow;

      await userEvent.keyboard("{Tab}");
      await nextTick();

      expect(document.activeElement).toBe(trigger);

      // The pseudo-class branch of this rule is `:focus-visible:not(:focus)`, which nothing ever
      // satisfies — so the ring exists only if the attribute is emitted.
      expect(trigger).toHaveAttribute("data-focus-visible", "true");

      // Drawn with `box-shadow`, not an outline, and the trigger already carries a resting
      // shadow — so the assertion has to be that it *changed*, not that it exists.
      expect(getComputedStyle(trigger).boxShadow).not.toBe(resting);
    });
  });

  describe("geometry", () => {
    it("makes the popover at least as wide as the trigger", async () => {
      const result = mount();

      await nextTick();

      const trigger = triggerOf(result).getBoundingClientRect();
      const popover = await open(result);

      // `min-w-(--trigger-width)`, fed by the custom property the positioner writes.
      expect(popover.style.getPropertyValue("--trigger-width")).toBe(`${trigger.width}px`);
      expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(trigger.width - 1);
    });

    it("puts the popover below the trigger", async () => {
      const result = mount();

      await nextTick();

      const trigger = triggerOf(result).getBoundingClientRect();
      const popover = await open(result);
      const box = popover.getBoundingClientRect();

      expect(popover).toHaveAttribute("data-placement", "bottom");
      expect(box.top).toBeGreaterThanOrEqual(trigger.bottom);
    });
  });

  describe("presence", () => {
    it("clears the entering marker once the animation finishes", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result);

      // The jsdom clock never advances, so `data-entering` is stuck there forever and this is
      // the only place the transition can be shown to complete.
      expect(popover).not.toHaveAttribute("data-entering");
    });

    it("leaves the DOM once the exit animation finishes", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result);

      await userEvent.keyboard("{Escape}");
      await nextTick();

      await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
    });
  });

  describe("focus", () => {
    it("gives focus back to the trigger when the popover is dismissed", async () => {
      const result = mount();

      await nextTick();

      const trigger = triggerOf(result);

      await open(result);

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await nextTick();
      await nextTick();

      expect(document.activeElement).toBe(trigger);
    });

    it("starts on the chosen option when the popover opens", async () => {
      const result = mount({defaultValue: "california"});

      await nextTick();

      const popover = await open(result);
      const options = [...popover.querySelectorAll<HTMLElement>('[role="option"]')];

      expect(document.activeElement).toBe(options[1]);
    });

    it("follows the pointer with the highlight", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result);
      const options = [...popover.querySelectorAll<HTMLElement>('[role="option"]')];

      await userEvent.hover(options[2]!);
      await nextTick();

      expect(document.activeElement).toBe(options[2]);
    });
  });

  describe("accessibility", () => {
    it("has no violations while closed", async () => {
      const result = mount({withLabel: true});

      await nextTick();

      await expectNoA11yViolations(result.container);
    });

    it("has no violations while open", async () => {
      const result = mount({withLabel: true});

      await nextTick();
      await open(result);

      await expectNoA11yViolations(document.body);
    });
  });
});
