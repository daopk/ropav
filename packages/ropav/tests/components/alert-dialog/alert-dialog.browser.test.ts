import {expectNoA11yViolations} from "@heroui/testing/helpers/a11y";
import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import AlertDialogFixture from "./fixtures.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(AlertDialogFixture, {props});

  mounted.push(result);

  return result;
};

type RenderResult = ReturnType<typeof render>;

/** Wait for every animation on the element to finish, so it is measured at its final size. */
const settled = async (element: HTMLElement) => {
  await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const slot = (name: string) => document.body.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const triggerOf = (result: RenderResult, name = "Delete account") =>
  result.getByRole("button", {name}) as HTMLElement;

const open = async (result: RenderResult, name?: string) => {
  await userEvent.click(triggerOf(result, name));
  await nextTick();
  await nextTick();
  await nextTick();

  const backdrop = slot("alert-dialog-backdrop")!;

  await settled(backdrop);
  await settled(slot("alert-dialog-container")!);

  return backdrop;
};

/**
 * Close through the dialog's own control and let both exits finish.
 *
 * Escape is not a way out of an alert dialog, which is exactly the point of the component — so
 * every case here has to leave through a button. Unmounting while open leaves the rest of the page
 * `inert`, and Playwright will not click through that, so a leak surfaces as a timeout somewhere
 * unrelated.
 */
const close = async (result: RenderResult, backdrop: HTMLElement) => {
  await userEvent.click(result.screen.getByTestId("close-from-slot") as unknown as HTMLElement);
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

  // The scroll lock and the `inert` marking live outside the container. A failing case throws
  // before it can close its dialog, and a leaked `inert` makes every later press time out instead
  // of failing — so one broken assertion would read as ten broken ones.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("AlertDialog (browser)", () => {
  describe("animation", () => {
    it("animates both elements in", async () => {
      const result = render();

      await userEvent.click(triggerOf(result));
      await nextTick();
      await nextTick();
      await nextTick();

      const backdrop = slot("alert-dialog-backdrop")!;
      const container = slot("alert-dialog-container")!;

      // Only a real browser can prove this: the states are decided by whether the element has
      // animations, and jsdom has none at all.
      expect(backdrop.getAttribute("data-entering")).toBe("true");
      expect(container.getAttribute("data-entering")).toBe("true");
      expect(backdrop.getAnimations().length).toBeGreaterThan(0);
      expect(container.getAnimations().length).toBeGreaterThan(0);

      await expect.poll(() => backdrop.getAttribute("data-entering")).toBeNull();
      await expect.poll(() => container.getAttribute("data-entering")).toBeNull();

      await close(result, backdrop);
      result.unmount();
    });

    it("marks both elements exiting and keeps both in the document", async () => {
      const result = render();
      const backdrop = await open(result);
      const container = slot("alert-dialog-container")!;

      await userEvent.click(result.screen.getByTestId("close-from-slot") as unknown as HTMLElement);
      await nextTick();
      await nextTick();

      // The exit is reported to both, and both stay mounted until every animation has finished.
      expect(backdrop.getAttribute("data-exiting")).toBe("true");
      expect(container.getAttribute("data-exiting")).toBe("true");
      expect(backdrop.isConnected).toBe(true);
      expect(container.isConnected).toBe(true);

      await settled(backdrop);
      await nextTick();
      await nextTick();

      expect(slot("alert-dialog-backdrop")).toBeNull();

      result.unmount();
    });
  });

  describe("dismissal", () => {
    it("stays open on a real Escape", async () => {
      const result = render();
      const backdrop = await open(result);

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await nextTick();

      // Pressed for real, from inside the focused dialog: the block has to hold on the path a user
      // actually takes, not only on a synthesised event.
      expect(slot("alert-dialog-dialog")).toBeTruthy();
      expect(backdrop.getAttribute("data-exiting")).toBeNull();

      await close(result, backdrop);
      result.unmount();
    });

    it("stays open on a real press beside the dialog", async () => {
      const result = render();
      const backdrop = await open(result);
      const dialog = slot("alert-dialog-dialog")!;
      const box = dialog.getBoundingClientRect();

      await userEvent.click(backdrop, {position: {x: Math.round(box.left + box.width / 2), y: 4}});
      await nextTick();
      await nextTick();

      expect(slot("alert-dialog-dialog")).toBeTruthy();

      await close(result, backdrop);
      result.unmount();
    });

    it("closes on a real press beside the dialog once asked for", async () => {
      const result = render({isDismissable: true});
      const backdrop = await open(result);
      const dialog = slot("alert-dialog-dialog")!;
      const box = dialog.getBoundingClientRect();

      // Just above the dialog, inside the backdrop. Synthetic events cannot prove this: the
      // dismissal is decided by where the pointer really landed.
      await userEvent.click(backdrop, {position: {x: Math.round(box.left + box.width / 2), y: 4}});
      await nextTick();
      await nextTick();

      await expect.poll(() => slot("alert-dialog-dialog")).toBeNull();

      result.unmount();
    });
  });

  describe("the page behind", () => {
    it("makes the rest of the page inert while it is open", async () => {
      const result = render();
      const backdrop = await open(result);

      // `inert` rather than `aria-hidden` in a real browser, which is the branch that also blocks
      // pointers and focus — the reason the underlay React renders is not ported.
      expect(result.container.hasAttribute("inert")).toBe(true);

      await close(result, backdrop);

      expect(result.container.hasAttribute("inert")).toBe(false);

      result.unmount();
    });

    it("gives focus back while the page is already live again", async () => {
      const result = render();
      const trigger = triggerOf(result);

      trigger.focus();

      const backdrop = await open(result);

      await close(result, backdrop);

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
      // The declaration is `h-(--visual-viewport-height)`, so a missing value leaves the backdrop
      // with no height and nothing on screen.
      expect(Math.round(Number.parseFloat(style.height))).toBe(Math.round(expected));

      await close(result, backdrop);
      result.unmount();
    });
  });

  describe("pointer events", () => {
    it("lets a press reach the dialog but not the container around it", async () => {
      const result = render();
      const backdrop = await open(result);

      // The container is the dismiss boundary and must not swallow presses aimed past it.
      expect(getComputedStyle(slot("alert-dialog-container")!).pointerEvents).toBe("none");
      expect(getComputedStyle(slot("alert-dialog-dialog")!).pointerEvents).toBe("auto");

      await close(result, backdrop);
      result.unmount();
    });

    it("leaves a button inside the dialog as an ordinary button", async () => {
      const result = render({withInsideButton: true});
      const backdrop = await open(result);
      const inside = document.body.querySelector<HTMLElement>(
        "[data-slot='alert-dialog-dialog'] [data-slot='button']",
      )!;

      // Nothing inside the dialog is the trigger. Pressed with a real pointer, because that is the
      // only thing that proves the trigger's press was cleared at the boundary.
      expect(inside.getAttribute("aria-expanded")).toBeNull();
      expect(inside.getAttribute("aria-controls")).toBeNull();

      await userEvent.click(inside);
      await nextTick();
      await nextTick();

      expect(slot("alert-dialog-dialog")).toBeTruthy();

      await close(result, backdrop);
      result.unmount();
    });
  });

  describe("the icon", () => {
    it("colours each status from its own palette", async () => {
      const result = render({
        iconStatus: "warning",
        secondIconStatus: "success",
        withIcon: true,
        withSecondIcon: true,
      });
      const backdrop = await open(result);
      const [first, second] = [
        ...document.body.querySelectorAll<HTMLElement>("[data-slot='alert-dialog-icon']"),
      ];

      // Resolved colours rather than class names: two icons carrying different meanings have to
      // actually look different, which is what the per-icon variant set buys.
      expect(getComputedStyle(first!).backgroundColor).not.toBe(
        getComputedStyle(second!).backgroundColor,
      );

      // The glyph is sized by a descendant rule keyed on its own slot, so a missing attribute
      // leaves it at its intrinsic 16px inside a 40px circle.
      const glyph = first!.querySelector<HTMLElement>("[data-slot='alert-dialog-default-icon']")!;

      expect(getComputedStyle(glyph).width).toBe("20px");
      expect(getComputedStyle(glyph).boxSizing).toBe("content-box");

      await close(result, backdrop);
      result.unmount();
    });
  });

  describe("focus", () => {
    it("keeps Tab inside the dialog", async () => {
      const result = render({withInsideButton: true});
      const backdrop = await open(result);
      const dialog = slot("alert-dialog-dialog")!;

      for (let step = 0; step < 6; step += 1) {
        await userEvent.keyboard("{Tab}");
        await nextTick();

        expect(dialog.contains(document.activeElement)).toBe(true);
      }

      await close(result, backdrop);
      result.unmount();
    });
  });

  describe("accessibility", () => {
    it("has no violations while open", async () => {
      const result = render({withCloseTrigger: true, withIcon: true});
      const backdrop = await open(result);

      await expectNoA11yViolations(slot("alert-dialog-dialog")!, {
        rules: {"color-contrast": {enabled: false}},
      });

      await close(result, backdrop);
      result.unmount();
    });
  });
});
