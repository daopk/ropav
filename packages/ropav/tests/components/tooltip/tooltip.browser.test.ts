import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { resetTooltipWarmup } from "@/composables/use-tooltip-trigger-state";

import { finishAnimations, startSlowMotion, stopSlowMotion } from "../../harness/slow-motion";
import { waitUntil } from "../../harness/wait-until";

import TooltipFixture from "./fixtures.vue";

/** Opens and closes at once, so a case can assert what happened rather than wait for it. */
const INSTANT = { closeDelay: 0, delay: 0 } as const;

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(TooltipFixture, { props: { ...INSTANT, ...props } });

  mounted.push(result);

  return result;
};

type RenderResult = ReturnType<typeof render>;

/** Wait for the entry or exit animation to finish, so the tooltip is measured at its final size. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

/**
 * Put the trigger where the tooltip fits above it.
 *
 * The default placement is `top`, and a trigger at the top of a short test window leaves no room
 * there — correct behaviour, but it hides whether the placement itself was honoured.
 */
const place = (result: RenderResult, top = "50%") => {
  result.container.style.position = "fixed";
  result.container.style.left = "120px";
  result.container.style.top = top;
};

const triggerOf = (result: RenderResult, name = "Open tooltip") =>
  result.getByRole("button", { name }) as HTMLElement;

const tooltipElement = () => document.body.querySelector<HTMLElement>(".rp-tooltip")!;

/**
 * Arrive at the trigger from a neighbouring element.
 *
 * Hover only opens a tooltip when the page already knows a pointer is being used, and for the very
 * first movement the boundary events land before the `pointermove` that would say so. A real user
 * has always moved the pointer before reaching a trigger; a test has to do it deliberately, and
 * from somewhere else — hovering an element the pointer is already over moves nothing and reports
 * nothing. React Aria gates hover the same way for the same reason.
 */
/**
 * Reach the trigger with a real Tab, from the button before it.
 *
 * Counting tab stops from wherever focus happens to be counts the whole page's tab order, and the
 * page holds more than this fixture — a second mount, a leftover portal, anything focusable a
 * previous case left behind shifts every stop along by one and the second Tab lands past the
 * trigger. That surfaced as `opens at once on keyboard focus` finding no tooltip, with nothing in
 * the case having touched focus.
 *
 * Starting from the outside button makes it one stop regardless, and the move is still a real
 * keypress, which is the part that has to be real: what opens the tooltip is keyboard focus.
 */
const tabToTrigger = async (result: RenderResult) => {
  (result.getByRole("button", { name: "Outside" }) as HTMLElement).focus();

  await userEvent.keyboard("{Tab}");
  await nextTick();
};

const arriveWithPointer = async (result: RenderResult) => {
  await userEvent.hover(result.getByRole("button", { name: "Outside" }) as HTMLElement);
  await nextTick();
};

const open = async (result: RenderResult, name?: string) => {
  await arriveWithPointer(result);
  await userEvent.hover(triggerOf(result, name));
  await nextTick();
  await nextTick();
  await nextTick();

  const tooltip = tooltipElement();

  await settled(tooltip);

  return tooltip;
};

const rect = (element: Element) => element.getBoundingClientRect();

afterEach(async () => {
  stopSlowMotion();

  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }

  // The warmup is shared by every tooltip on the page and outlives all of them, so a case that
  // left one warm would make the next open with no delay and read as a bug there instead.
  resetTooltipWarmup();
  // Parked away from wherever the next case renders, so a leftover position cannot count as a
  // hover on something that has not appeared yet.
  await userEvent.hover(document.documentElement);
  await nextTick();
});

describe("Tooltip (browser)", () => {
  describe("pointer", () => {
    it("opens on a real hover and closes when the pointer leaves", async () => {
      const result = render();

      place(result);

      const tooltip = await open(result);

      expect(tooltip).toBeTruthy();
      expect(tooltip.getAttribute("role")).toBe("tooltip");

      await userEvent.hover(result.getByRole("button", { name: "Outside" }) as HTMLElement);
      await settled(tooltip);
      await nextTick();
      await nextTick();

      // Only a real pointer proves this: hover is the one gesture a synthetic event cannot stand
      // in for, because the modality gate asks how the user is actually driving the page.
      expect(document.body.querySelector(".rp-tooltip")).toBeNull();

      result.unmount();
    });

    it("stays open while the pointer is on the tooltip itself", async () => {
      const result = render({ closeDelay: 300, delay: 0 });

      place(result);

      const tooltip = await open(result);

      await userEvent.hover(tooltip);
      await nextTick();
      await nextTick();

      expect(document.body.querySelector(".rp-tooltip")).toBeTruthy();

      result.unmount();
    });

    it("waits out a real delay", async () => {
      const result = render({ closeDelay: 0, delay: 400 });

      place(result);

      await arriveWithPointer(result);
      await userEvent.hover(triggerOf(result));
      await nextTick();

      expect(document.body.querySelector(".rp-tooltip")).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 500));
      await nextTick();
      await nextTick();

      expect(document.body.querySelector(".rp-tooltip")).toBeTruthy();

      result.unmount();
    });
  });

  describe("keyboard", () => {
    it("opens at once on keyboard focus", async () => {
      const result = render({ delay: 3000 });

      place(result);

      await tabToTrigger(result);

      // Asserted before the tooltip, so focus landing somewhere else reads as that rather than as
      // the tooltip having failed to open.
      expect(document.activeElement).toBe(triggerOf(result));

      // Focus does not wait, even with a long hover delay configured: a user who tabbed here
      // asked for the label deliberately.
      expect(document.body.querySelector(".rp-tooltip")).toBeTruthy();

      result.unmount();
    });

    it("closes on Escape", async () => {
      const result = render({ delay: 3000 });

      place(result);

      await tabToTrigger(result);

      expect(document.activeElement).toBe(triggerOf(result));

      const tooltip = tooltipElement();

      // The entry finishes before Escape is pressed, so the dismissal is not racing the animation
      // it is meant to follow.
      await settled(tooltip);

      await userEvent.keyboard("{Escape}");
      await waitUntil("the tooltip to leave the document", () => tooltipElement() === null);

      result.unmount();
    });
  });

  describe("geometry", () => {
    it("sits above the trigger, three pixels clear of it", async () => {
      const result = render({ shouldFlip: false });

      place(result);

      const tooltip = await open(result);
      const trigger = triggerOf(result);

      const gap = rect(trigger).top - rect(tooltip).bottom;

      // Whole pixels: the trigger's height can be fractional, which puts a sub-pixel remainder in
      // the gap that has nothing to do with the offset.
      expect(Math.round(gap)).toBe(3);

      result.unmount();
    });

    it("leaves room for the arrow when one is asked for", async () => {
      const result = render({ shouldFlip: false, showArrow: true, withArrow: true });

      place(result);

      const tooltip = await open(result);
      const trigger = triggerOf(result);

      const gap = rect(trigger).top - rect(tooltip).bottom;

      // Wider than the bare tooltip's, which is what the arrow occupies.
      expect(Math.round(gap)).toBe(7);

      result.unmount();
    });

    it("centres on the trigger and publishes the anchor point", async () => {
      const result = render({ shouldFlip: false });

      place(result);

      const tooltip = await open(result);
      const trigger = triggerOf(result);
      const style = getComputedStyle(tooltip);

      expect(Math.round(rect(tooltip).left + rect(tooltip).width / 2)).toBe(
        Math.round(rect(trigger).left + rect(trigger).width / 2),
      );

      // The stylesheet scales the tooltip from this point, so a missing value would zoom it in
      // from its own centre instead of out of its trigger.
      expect(style.getPropertyValue("--trigger-anchor-point")).toMatch(/^-?[\d.]+px -?[\d.]+px$/);
      expect(style.position).toBe("absolute");

      result.unmount();
    });

    it("flips below the trigger when there is no room above", async () => {
      const result = render();

      // Hard against the top of the window, so `top` cannot fit.
      place(result, "0px");

      const tooltip = await open(result);

      expect(tooltip.getAttribute("data-placement")).toBe("bottom");
      expect(rect(tooltip).top).toBeGreaterThan(rect(triggerOf(result)).top);

      result.unmount();
    });

    it("stays on the requested side when flipping is off", async () => {
      const result = render({ placement: "bottom", shouldFlip: false });

      place(result);

      const tooltip = await open(result);

      expect(tooltip.getAttribute("data-placement")).toBe("bottom");
      expect(rect(tooltip).top).toBeGreaterThan(rect(triggerOf(result)).bottom - 1);

      result.unmount();
    });
  });

  describe("arrow", () => {
    it("centres the arrow on the trigger", async () => {
      const result = render({ shouldFlip: false, showArrow: true, withArrow: true });

      place(result);

      await open(result);

      const group = document.body.querySelector<HTMLElement>("[data-slot='tooltip-arrow']")!;
      const trigger = triggerOf(result);

      expect(Math.round(rect(group).left + rect(group).width / 2)).toBe(
        Math.round(rect(trigger).left + rect(trigger).width / 2),
      );
      // Overlapping the edge the tooltip is placed against, not merely touching it: shapes that
      // touch each antialias the shared row at fractional device pixel ratios, and the page
      // bleeds through the seam. The 2px is the shape's straight skirt, so the flare that meets
      // the body's edge stays whole.
      expect(Math.round(rect(tooltipElement()).bottom - rect(group).top)).toBe(2);

      result.unmount();
    });

    it("moves the edge treatment onto the combined silhouette", async () => {
      const result = render({ shouldFlip: false, showArrow: true, withArrow: true });

      place(result);

      await open(result);

      const styles = getComputedStyle(tooltipElement());

      // The arrow overlaps a body it is filled to match, so an edge painted on the body alone
      // would stop at the join. With an arrow present the body's own shadow steps aside and the
      // edge is a filter, which follows the silhouette of body and arrow as one. The light theme
      // spells `--overlay-edge` as drop-shadows, which is what the suite runs under.
      expect(styles.boxShadow).toBe("none");
      expect(styles.filter).toContain("drop-shadow");

      result.unmount();
    });

    it("keeps the body's own shadow when there is no arrow", async () => {
      const result = render({ shouldFlip: false });

      place(result);

      await open(result);

      const styles = getComputedStyle(tooltipElement());

      expect(styles.boxShadow).not.toBe("none");
      expect(styles.filter).not.toContain("drop-shadow");
      expect(styles.filter).not.toContain("url");

      result.unmount();
    });

    it("takes its colour from the overlay", async () => {
      const result = render({ shouldFlip: false, showArrow: true, withArrow: true });

      place(result);

      await open(result);

      const arrow = document.body.querySelector<HTMLElement>("[data-slot='overlay-arrow']")!;
      const tooltip = tooltipElement();

      // The default shape ships `fill="none"` as a presentation attribute, and the stylesheet
      // overrides it through the slot — which is the whole reason a custom arrow has to carry the
      // slot itself. Compared against the tooltip's own background, since both resolve `--overlay`.
      expect(getComputedStyle(arrow).fill).toBe(getComputedStyle(tooltip).backgroundColor);

      result.unmount();
    });

    it("points down when the tooltip sits below its trigger", async () => {
      const result = render({
        placement: "bottom",
        shouldFlip: false,
        showArrow: true,
        withArrow: true,
      });

      place(result);

      await open(result);

      const arrow = document.body.querySelector<HTMLElement>("[data-slot='overlay-arrow']")!;

      // The shape is drawn pointing up, so the stylesheet turns it over for the other side.
      expect(getComputedStyle(arrow).rotate).toBe("180deg");

      result.unmount();
    });

    it("points sideways when the tooltip sits beside its trigger", async () => {
      const result = render({
        placement: "right",
        shouldFlip: false,
        showArrow: true,
        withArrow: true,
      });

      place(result);

      const tooltip = await open(result);

      const arrow = document.body.querySelector<HTMLElement>("[data-slot='overlay-arrow']")!;
      const expected = tooltip.getAttribute("data-placement") === "right" ? "90deg" : "-90deg";

      expect(getComputedStyle(arrow).rotate).toBe(expected);

      result.unmount();
    });
  });

  describe("animation", () => {
    it("animates in once it has been placed", async () => {
      const result = render();

      place(result);

      // Before the hover, because the entry animation starts with it: everything below has to be
      // read while that animation is still running, and at the stylesheet's own duration that is a
      // couple of hundred milliseconds shared with two `userEvent` round trips.
      startSlowMotion();

      await arriveWithPointer(result);
      await userEvent.hover(triggerOf(result));
      await nextTick();
      await nextTick();
      await nextTick();

      const tooltip = tooltipElement();

      // Only a real browser can prove this: `data-entering` is decided by whether the element has
      // animations, and jsdom has none at all.
      expect(tooltip.getAttribute("data-entering")).toBe("true");
      expect(tooltip.getAnimations().length).toBeGreaterThan(0);

      // Driven to the end rather than waited out — the claim is that the phase clears when the
      // animation finishes, not that it lasts as long as the stylesheet says.
      finishAnimations(tooltip);
      await settled(tooltip);

      expect(tooltip.getAttribute("data-entering")).toBeNull();

      result.unmount();
    });

    it("stays in the document while it animates out", async () => {
      const result = render({ closeDelay: 0, delay: 0 });

      place(result);

      const tooltip = await open(result);

      // After the entry has settled, so only the exit is stretched.
      startSlowMotion();

      await userEvent.hover(result.getByRole("button", { name: "Outside" }) as HTMLElement);
      await nextTick();
      await nextTick();

      // Held in the DOM through the exit, which is otherwise a contradiction: the tooltip has to
      // be gone and has to still be there to animate.
      expect(tooltip.getAttribute("data-exiting")).toBe("true");
      expect(tooltip.isConnected).toBe(true);

      finishAnimations(tooltip);
      await settled(tooltip);
      await nextTick();
      await nextTick();

      expect(document.body.querySelector(".rp-tooltip")).toBeNull();

      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no violations while open", async () => {
      const result = render({ showArrow: true, withArrow: true });

      place(result);

      const tooltip = await open(result);

      // Scoped to the tooltip, the way the popover suite scopes its own: the trigger is an
      // ordinary button covered by the button suite, and its primary variant pairs `--accent`
      // with `--accent-foreground` under the AA floor — a palette finding in `@ropav/styles`,
      // not something the tooltip decides.
      await expectNoA11yViolations(tooltip);

      result.unmount();
    });
  });
});
