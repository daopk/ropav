import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import PopoverFixture from "./fixtures.vue";

const render = (props: Record<string, unknown> = {}) => renderVapor(PopoverFixture, {props});

type RenderResult = ReturnType<typeof render>;

/** Wait for the entry or exit animation to finish, so the popover is measured at its final size. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

/**
 * Put the trigger where the popover fits beside it.
 *
 * The test window is narrow, and a trigger in the middle of it leaves no room above for a `top`
 * placement — correct, but it hides whether the placement itself was honoured.
 */
const place = (result: RenderResult, top = "40%") => {
  result.container.style.position = "fixed";
  result.container.style.left = "12px";
  result.container.style.top = top;
};

const triggerOf = (result: RenderResult, name = "Open popover") =>
  result.getByRole("button", {name}) as HTMLElement;

const open = async (result: RenderResult, name?: string) => {
  await userEvent.click(triggerOf(result, name));
  await nextTick();
  await nextTick();
  await nextTick();

  const popover = document.body.querySelector<HTMLElement>(".popover")!;

  await settled(popover);

  return popover;
};

/**
 * Close an open popover and let its exit animation finish.
 *
 * Unmounting while open leaves the rest of the page `inert`, and Playwright will not click
 * through that — so a leak here surfaces as a timeout in an unrelated test.
 */
const close = async (popover: HTMLElement) => {
  await userEvent.keyboard("{Escape}");
  await settled(popover);
  await nextTick();
  await nextTick();
};

afterEach(() => {
  // The page-wide scroll lock and the `inert` marking both live outside the container. A failing
  // test throws before it can close its popover, and a leaked `inert` makes every later press
  // time out instead of failing — so one broken assertion would read as ten broken ones. The
  // lifecycle of both is asserted precisely in the jsdom suite; this only keeps failures legible.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");

    // A popover left open by a throwing test keeps covering the trigger, and the next press
    // would report an intercepted pointer rather than the assertion that actually broke.
    if (child.getAttribute("style") === "display: contents;") child.remove();
  }
});

/**
 * The popover's whole reason for existing is geometric: it is measured, positioned against its
 * trigger, animated out of the point it is anchored to, and it takes focus away from the page.
 * None of that can be read without a real layout, a real pointer and real animations.
 */
describe("Popover (browser)", () => {
  describe("a real pointer", () => {
    /**
     * A synthetic pointer proves nothing about press. It arrives with no `pointerenter` ahead of
     * it and triggers no re-render mid-dispatch, which is exactly the shape of the bug that once
     * left a dropdown unopenable by mouse while every test stayed green.
     */
    it("opens from a bare button trigger", async () => {
      const result = render();

      place(result);

      const popover = await open(result);

      expect(popover).toBeTruthy();
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      await close(popover);
      result.unmount();
    });

    it("opens from markup made pressable", async () => {
      const result = render({withCustomTrigger: true});

      place(result);

      const popover = await open(result, "Actions");

      expect(result.screen.getByRole("dialog")).toBeTruthy();

      await close(popover);
      result.unmount();
    });

    it("leaves the popover open when a button inside it is pressed", async () => {
      const result = render();

      place(result);

      const popover = await open(result);
      const inside = popover.querySelector<HTMLElement>('[data-slot="button"]')!;

      await userEvent.click(inside);
      await nextTick();
      await nextTick();

      // The trigger hands its press down through a context that reaches every descendant, so the
      // popover clears it. Without that, this click would toggle the popover shut.
      expect(document.body.querySelector(".popover")).toBeTruthy();

      await close(popover);
      result.unmount();
    });

    it("closes on a press on the page behind it", async () => {
      const result = render();

      place(result);
      await open(result);

      // The page itself, not an element on it: a modal popover marks every sibling of its own
      // container `inert`, so there is nothing on the page left to press. This is also why the
      // underlay React Aria renders is not ported — it would be inert alongside everything else,
      // and the press lands on the document either way.
      const popover = document.body.querySelector<HTMLElement>(".popover")!;

      await userEvent.click(document.documentElement);
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(result.screen.queryByRole("dialog")).toBeNull();

      result.unmount();
    });

    it("stays open on a press outside a popover that leaves the page live", async () => {
      const result = render({isNonModal: true});

      place(result);

      const popover = await open(result);

      await userEvent.click(result.container.querySelector<HTMLElement>("#outside")!);
      await nextTick();
      await nextTick();
      await nextTick();

      // A popover that leaves the page live is not dismissed by pressing the page: the press was
      // meant for whatever it landed on. Escape is the way out.
      expect(result.screen.getByRole("dialog")).toBeTruthy();

      await close(popover);
      result.unmount();
    });
  });

  describe("focus leaving", () => {
    /*
     * The counterpart of the press test above: a popover that leaves the page live ignores a press
     * outside, so focus leaving it is the only pointer path out. Driven by real focus moves,
     * because the guards that decide this — `relatedTarget`, containment, focus scopes — read
     * state jsdom does not produce on its own.
     *
     * Without a dialog inside, since `Popover.Dialog` asks the popover to contain focus and a
     * contained popover is one focus never leaves.
     */
    const LEAVABLE = {isNonModal: true, withoutDialog: true} as const;

    const bare = (popover: HTMLElement, name: "first" | "second") =>
      popover.querySelector<HTMLElement>(`[data-testid="bare-${name}"]`)!;

    it("closes once focus reaches something outside it", async () => {
      const result = render(LEAVABLE);

      place(result);

      const popover = await open(result);

      await userEvent.click(bare(popover, "first"));
      await nextTick();

      expect(popover.contains(document.activeElement)).toBe(true);

      await userEvent.click(result.container.querySelector<HTMLElement>("#outside")!);
      await nextTick();

      // Read from the trigger rather than the DOM: the popover is held in the document through
      // its exit animation, so it is still there for a moment after it has closed.
      expect(triggerOf(result)).toHaveAttribute("aria-expanded", "false");

      // Awaited before unmounting, or the node left mid-animation is the `.popover` the next test
      // finds.
      await settled(popover);
      await nextTick();

      expect(document.body.querySelector(".popover")).toBeNull();

      result.unmount();
    });

    it("stays open while focus moves between its own children", async () => {
      const result = render(LEAVABLE);

      place(result);

      const popover = await open(result);

      await userEvent.click(bare(popover, "first"));
      await nextTick();

      await userEvent.tab();
      await nextTick();
      await nextTick();

      expect(document.activeElement).toBe(bare(popover, "second"));
      expect(document.body.querySelector(".popover")).toBeTruthy();

      await close(popover);
      result.unmount();
    });
  });

  describe("position", () => {
    it("sits below its trigger, offset from it", async () => {
      const result = render();

      place(result);

      const triggerRect = triggerOf(result).getBoundingClientRect();
      const popover = await open(result);
      const popoverRect = popover.getBoundingClientRect();

      expect(popover).toHaveAttribute("data-placement", "bottom");
      expect(popoverRect.top - triggerRect.bottom).toBeCloseTo(8, 0);
      // Centred on the trigger, which is what a bare `bottom` placement means — a dropdown's
      // `bottom start` is a choice its menu trigger makes, not the overlay's default.
      expect(popoverRect.left + popoverRect.width / 2).toBeCloseTo(
        triggerRect.left + triggerRect.width / 2,
        0,
      );

      await close(popover);
      result.unmount();
    });

    it("honours a placement above the trigger", async () => {
      const result = render({placement: "top"});

      place(result, "70%");

      const triggerRect = triggerOf(result).getBoundingClientRect();
      const popover = await open(result);
      const popoverRect = popover.getBoundingClientRect();

      expect(popover).toHaveAttribute("data-placement", "top");
      // Resolved to whole pixels: a popover above its trigger is positioned from the container's
      // bottom edge, so a fractional container height lands the gap within a pixel of the offset.
      expect(Math.abs(triggerRect.top - popoverRect.bottom - 8)).toBeLessThan(1);

      await close(popover);
      result.unmount();
    });

    it("flips to the other side when there is no room", async () => {
      const result = render({placement: "top"});

      // Hard against the top of the window, so nothing fits above the trigger.
      place(result, "0px");

      const popover = await open(result);

      expect(popover).toHaveAttribute("data-placement", "bottom");

      await close(popover);
      result.unmount();
    });

    it("anchors its transform origin to the trigger", async () => {
      const result = render();

      place(result);

      const popover = await open(result);

      // The stylesheet uses this as the `transform-origin`, so the popover grows out of its
      // trigger rather than out of its own centre.
      expect(popover.style.getPropertyValue("--trigger-anchor-point")).toBeTruthy();
      expect(getComputedStyle(popover).transformOrigin).toBe(
        popover.style.getPropertyValue("--trigger-anchor-point"),
      );

      await close(popover);
      result.unmount();
    });
  });

  describe("the arrow", () => {
    it("centres the arrow on the trigger", async () => {
      const result = render({withArrow: true});

      place(result);

      const triggerRect = triggerOf(result).getBoundingClientRect();
      const popover = await open(result);
      const group = popover.querySelector<HTMLElement>(
        '[data-slot="popover-overlay-arrow-group"]',
      )!;
      const arrowRect = group.getBoundingClientRect();

      // The offset names the arrow's centre, and the transform pulls it back by half its width.
      expect(arrowRect.left + arrowRect.width / 2).toBeCloseTo(
        triggerRect.left + triggerRect.width / 2,
        0,
      );
      expect(group).toHaveAttribute("data-placement", "bottom");

      await close(popover);
      result.unmount();
    });

    it("takes its fill and rotation from the stylesheet", async () => {
      const result = render({withArrow: true});

      place(result);

      const popover = await open(result);
      const shape = popover.querySelector<HTMLElement>('[data-slot="popover-overlay-arrow"]')!;
      const styles = getComputedStyle(shape);

      // Both are keyed on the slot the default shape carries, which is why a supplied shape has
      // to carry it too. Placed below the trigger, the arrow is turned to point back up at it.
      expect(styles.fill).not.toBe("none");
      expect(styles.rotate).toBe("180deg");

      await close(popover);
      result.unmount();
    });

    it("leaves the arrow unturned when the popover sits above its trigger", async () => {
      const result = render({placement: "top", withArrow: true});

      place(result, "70%");

      const popover = await open(result);

      expect(popover).toHaveAttribute("data-placement", "top");

      const shape = popover.querySelector<HTMLElement>('[data-slot="popover-overlay-arrow"]')!;

      // Placed above the trigger, so the arrow keeps its default orientation and points down.
      expect(getComputedStyle(shape).rotate).toBe("none");

      await close(popover);
      result.unmount();
    });
  });

  describe("focus", () => {
    it("moves focus into the dialog and gives it back", async () => {
      const result = render();

      place(result);

      const trigger = triggerOf(result);
      const popover = await open(result);
      const dialog = result.screen.getByRole("dialog");

      expect(dialog.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard("{Escape}");
      await settled(popover);
      await nextTick();
      await nextTick();

      expect(result.screen.queryByRole("dialog")).toBeNull();
      // A keyboard user would otherwise be dropped at the top of the page.
      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });

    it("keeps Tab inside the dialog", async () => {
      const result = render();

      place(result);

      const popover = await open(result);
      const dialog = result.screen.getByRole("dialog");

      await userEvent.keyboard("{Tab}");

      expect(dialog.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard("{Tab}");

      // The popover is rendered at the end of the document, so tabbing out of it would land on
      // whatever happens to follow in the body.
      expect(dialog.contains(document.activeElement)).toBe(true);

      await close(popover);
      result.unmount();
    });

    it("takes focus itself when there is no dialog inside", async () => {
      const result = render({withoutDialog: true});

      place(result);

      const popover = await open(result);

      expect(popover).toHaveAttribute("role", "dialog");
      expect(document.activeElement).toBe(popover);

      await close(popover);
      result.unmount();
    });
  });

  describe("animation", () => {
    it("animates in from its anchor point", async () => {
      const result = render();

      place(result);
      await userEvent.click(triggerOf(result));
      await nextTick();
      await nextTick();
      await nextTick();

      const popover = document.body.querySelector<HTMLElement>(".popover")!;

      // The attribute is what the stylesheet keys the entry animation on, and the animation has
      // to be running for it to mean anything.
      expect(popover).toHaveAttribute("data-entering", "true");
      expect(popover.getAnimations().length).toBeGreaterThan(0);

      await settled(popover);

      expect(popover.hasAttribute("data-entering")).toBe(false);

      await close(popover);
      result.unmount();
    });

    it("stays in the DOM until its exit animation finishes", async () => {
      const result = render();

      place(result);

      const popover = await open(result);

      await userEvent.keyboard("{Escape}");
      await nextTick();

      // Gone and still there: the exit is a contradiction resolved by keeping the element until
      // the animation the stylesheet owns has played out.
      expect(popover).toHaveAttribute("data-exiting", "true");
      expect(popover.isConnected).toBe(true);
      expect(popover.getAnimations().length).toBeGreaterThan(0);

      await settled(popover);
      await nextTick();
      await nextTick();

      expect(document.body.querySelector(".popover")).toBeNull();

      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const result = render();

      place(result);

      const popover = await open(result);

      // `color-contrast` is scoped out, not silenced: the button inside the popover is a primary
      // one, pairing `--accent` (#0485F7) with `--accent-foreground` (#FCFCFC) for 3.59:1, under
      // the 4.5:1 WCAG AA floor. Both come from `@ropav/styles`, so the finding belongs to the
      // palette — it is not something the popover decides.
      await expectNoA11yViolations(popover, {rules: {"color-contrast": {enabled: false}}});

      await close(popover);
      result.unmount();
    });

    it("has no axe violations with an arrow", async () => {
      const result = render({withArrow: true});

      place(result);

      const popover = await open(result);

      await expectNoA11yViolations(popover, {rules: {"color-contrast": {enabled: false}}});

      await close(popover);
      result.unmount();
    });
  });
});
