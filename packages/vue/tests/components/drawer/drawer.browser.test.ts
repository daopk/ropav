import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import DrawerFixture from "./fixtures.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(DrawerFixture, {props});

  mounted.push(result);

  return result;
};

type RenderResult = ReturnType<typeof render>;

/** Wait for every animation on the element to finish, so it is measured at its final position. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const slot = (name: string) => document.body.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const triggerOf = (result: RenderResult) =>
  result.getByRole("button", {name: "Open drawer"}) as HTMLElement;

const open = async (result: RenderResult) => {
  await userEvent.click(triggerOf(result));
  await nextTick();
  await nextTick();
  await nextTick();

  const backdrop = slot("drawer-backdrop")!;

  await settled(backdrop);
  await settled(slot("drawer-content")!);
  await settled(slot("drawer-dialog")!);

  return backdrop;
};

/**
 * Close and let every animation finish.
 *
 * Unmounting while open leaves the rest of the page `inert`, and Playwright will not click through
 * that — so a leak here surfaces as a timeout in an unrelated test.
 */
const close = async (backdrop: HTMLElement) => {
  await userEvent.keyboard("{Escape}");
  await settled(backdrop);
  await nextTick();
  await nextTick();
};

afterEach(() => {
  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }

  // The scroll lock and the `inert` marking live outside the content. A failing case throws before
  // it can close its drawer, and a leaked `inert` makes every later press time out instead of
  // failing — so one broken assertion would read as ten broken ones.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("Drawer (browser)", () => {
  describe("the slide in", () => {
    it("starts the panel off screen and brings it to rest", async () => {
      const result = render();

      await userEvent.click(triggerOf(result));
      await nextTick();
      await nextTick();
      await nextTick();

      const dialog = slot("drawer-dialog")!;
      const backdrop = slot("drawer-backdrop")!;
      const running = (element: HTMLElement) =>
        element.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty);

      /*
       * Asserted as a running transition rather than as a `data-entering` attribute.
       *
       * The entry state is only ever a *style computation*: the content carries `data-entering` long
       * enough for the browser to resolve the panel's off-screen `translate`, and dropping it is
       * what starts the transition. By the time any tick is observable the attribute has already
       * done its job and gone, so watching for it would be watching the wrong thing — the movement
       * is the contract, and only a real browser has it.
       */
      expect(
        Number.parseFloat(getComputedStyle(dialog).translate.split(" ")[1] ?? "0"),
      ).toBeGreaterThan(0);
      expect(running(dialog)).toContain("translate");
      // The panel's transition lives on a descendant of the content, so the backdrop's is the half
      // of the union that has to keep the whole thing mounted.
      expect(running(backdrop)).toContain("opacity");

      await expect.poll(() => getComputedStyle(slot("drawer-dialog")!).translate).toBe("0px");
      expect(dialog.getAnimations()).toHaveLength(0);

      await close(backdrop);
      result.unmount();
    });

    it("holds the content in the document while the panel slides away", async () => {
      const result = render();
      const backdrop = await open(result);
      const content = slot("drawer-content")!;
      const dialog = slot("drawer-dialog")!;

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await nextTick();

      /*
       * The assertion the whole presence union exists for.
       *
       * `.drawer__content` has no transition of its own, so asked alone it would report nothing to
       * wait for and unmount at once — taking the panel with it before a pixel of the slide had
       * run. What holds it here is the backdrop's opacity transition, the other half of the union.
       */
      expect(content.getAttribute("data-exiting")).toBe("true");
      expect(backdrop.getAttribute("data-exiting")).toBe("true");
      expect(content.isConnected).toBe(true);
      expect(dialog.isConnected).toBe(true);
      expect(getComputedStyle(dialog).translate).not.toBe("none");

      await settled(backdrop);
      await nextTick();
      await nextTick();

      expect(slot("drawer-backdrop")).toBeNull();

      result.unmount();
    });

    it("slides from the edge it is pinned to", async () => {
      for (const [placement, axis] of [
        ["left", "x"],
        ["right", "x"],
        ["top", "y"],
        ["bottom", "y"],
      ] as const) {
        const result = render({placement});

        await userEvent.click(triggerOf(result));
        await nextTick();
        await nextTick();
        await nextTick();

        const translate = getComputedStyle(slot("drawer-dialog")!).translate;
        const [x = "0px", y = "0px"] = translate.split(" ");
        const moving = axis === "x" ? x : y;
        const still = axis === "x" ? y : x;

        // Off screen along one axis only, so a drawer pinned to an edge never arrives diagonally.
        expect(Math.abs(Number.parseFloat(moving)), placement).toBeGreaterThan(0);
        expect(Number.parseFloat(still) || 0, placement).toBe(0);

        await close(slot("drawer-backdrop")!);
        result.unmount();
      }
    });
  });

  describe("the page behind", () => {
    it("makes the rest of the page inert while it is open", async () => {
      const result = render();
      const backdrop = await open(result);

      // `inert` rather than `aria-hidden` in a real browser, which is the branch that also blocks
      // pointers and focus.
      expect(result.container.hasAttribute("inert")).toBe(true);

      await close(backdrop);

      expect(result.container.hasAttribute("inert")).toBe(false);

      result.unmount();
    });

    it("gives focus back while the page is already live again", async () => {
      const result = render();
      const trigger = triggerOf(result);

      trigger.focus();

      const backdrop = await open(result);

      await close(backdrop);

      // The order the two are torn down in is the assertion: focus cannot be given to a trigger
      // that is still inside an inert subtree, so un-inerting has to happen first.
      expect(result.container.hasAttribute("inert")).toBe(false);
      expect(document.activeElement).toBe(trigger);

      result.unmount();
    });

    it("publishes the viewport height the stylesheet sizes it from", async () => {
      const result = render();
      const backdrop = await open(result);
      const style = getComputedStyle(backdrop);
      const expected = window.visualViewport?.height ?? document.documentElement.clientHeight;

      expect(style.getPropertyValue("--visual-viewport-height")).toBe(`${expected}px`);
      // Both the backdrop and the content are sized from it, so a missing value leaves the drawer
      // with no height at all.
      expect(Math.round(Number.parseFloat(style.height))).toBe(Math.round(expected));
      expect(Math.round(Number.parseFloat(getComputedStyle(slot("drawer-content")!).height))).toBe(
        Math.round(expected),
      );

      await close(backdrop);
      result.unmount();
    });
  });

  describe("pointer events", () => {
    it("lets a press reach the panel but not the content around it", async () => {
      const result = render();
      const backdrop = await open(result);

      // The content is the dismiss boundary and must not swallow presses aimed past it, which is
      // what makes a press on the empty space beside the panel dismiss the drawer.
      expect(getComputedStyle(slot("drawer-content")!).pointerEvents).toBe("none");
      expect(getComputedStyle(slot("drawer-dialog")!).pointerEvents).toBe("auto");

      await close(backdrop);
      result.unmount();
    });

    it("closes on a real press beside the panel", async () => {
      const result = render();
      const backdrop = await open(result);
      const box = slot("drawer-dialog")!.getBoundingClientRect();

      // Above a bottom-pinned panel, inside the backdrop. Synthetic events cannot prove this: the
      // dismissal is decided by where the pointer really landed.
      await userEvent.click(backdrop, {position: {x: Math.round(box.left + box.width / 2), y: 4}});
      await nextTick();
      await nextTick();

      // Polled, because both elements are held in the document until their exits have finished.
      await expect.poll(() => slot("drawer-dialog")).toBeNull();

      result.unmount();
    });

    it("leaves a button inside the panel as an ordinary button", async () => {
      const result = render({withInsideButton: true});
      const backdrop = await open(result);
      const inside = document.body.querySelector<HTMLElement>(
        "[data-slot='drawer-dialog'] [data-slot='button']",
      )!;

      // Nothing inside the drawer is the trigger. Pressed with a real pointer, because that is the
      // only thing that proves the trigger's press was cleared at the boundary.
      expect(inside.getAttribute("aria-expanded")).toBeNull();
      expect(inside.getAttribute("aria-controls")).toBeNull();

      await userEvent.click(inside);
      await nextTick();
      await nextTick();

      expect(slot("drawer-dialog")).toBeTruthy();

      await close(backdrop);
      result.unmount();
    });
  });

  describe("the handle", () => {
    it("draws a bar the stylesheet reaches by its own slot", async () => {
      const result = render({withHandle: true});
      const backdrop = await open(result);
      const bar = slot("drawer-handle")!.querySelector<HTMLElement>(
        "[data-slot='drawer-handle-bar']",
      )!;
      const style = getComputedStyle(bar);

      // A direct-child selector keyed on the slot, so a renamed attribute leaves an invisible
      // zero-height box where the grab affordance should be.
      expect(style.height).toBe("4px");
      expect(style.width).toBe("36px");
      expect(Number.parseFloat(style.borderRadius)).toBeGreaterThan(0);

      await close(backdrop);
      result.unmount();
    });
  });

  describe("focus", () => {
    it("keeps Tab inside the panel", async () => {
      const result = render({withInsideButton: true});
      const backdrop = await open(result);
      const dialog = slot("drawer-dialog")!;

      for (let step = 0; step < 6; step += 1) {
        await userEvent.keyboard("{Tab}");
        await nextTick();

        expect(dialog.contains(document.activeElement)).toBe(true);
      }

      await close(backdrop);
      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no violations while open", async () => {
      const result = render({withCloseTrigger: true, withHandle: true});
      const backdrop = await open(result);

      await expectNoA11yViolations(slot("drawer-dialog")!, {
        rules: {"color-contrast": {enabled: false}},
      });

      await close(backdrop);
      result.unmount();
    });
  });
});
