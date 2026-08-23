import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { finishAnimations, startSlowMotion, stopSlowMotion } from "../../harness/slow-motion";

import ModalFixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(ModalFixture, { props });

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

const triggerOf = (result: RenderResult, name = "Open modal") =>
  result.getByRole("button", { name }) as HTMLElement;

const open = async (result: RenderResult, name?: string) => {
  await userEvent.click(triggerOf(result, name));
  await nextTick();
  await nextTick();
  await nextTick();

  const backdrop = slot("modal-backdrop")!;

  await settled(backdrop);
  await settled(slot("modal-container")!);

  return backdrop;
};

/**
 * Close and let both exits finish.
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
  stopSlowMotion();

  while (mounted.length > 0) {
    try {
      mounted.pop()!.unmount();
    } catch {
      // Already unmounted by the case itself, which is the normal path.
    }
  }

  // The scroll lock and the `inert` marking live outside the container. A failing case throws
  // before it can close its modal, and a leaked `inert` makes every later press time out instead
  // of failing — so one broken assertion would read as ten broken ones.
  document.documentElement.style.overflow = "";

  for (const child of [...document.body.children]) {
    child.removeAttribute("inert");
    child.removeAttribute("aria-hidden");
  }
});

describe("Modal (browser)", () => {
  describe("animation", () => {
    it("animates both elements in", async () => {
      const result = render();

      await userEvent.click(triggerOf(result));
      await nextTick();
      await nextTick();
      await nextTick();

      const backdrop = slot("modal-backdrop")!;
      const container = slot("modal-container")!;

      // Only a real browser can prove this: the states are decided by whether the element has
      // animations, and jsdom has none at all.
      expect(backdrop.getAttribute("data-entering")).toBe("true");
      expect(container.getAttribute("data-entering")).toBe("true");
      expect(backdrop.getAnimations().length).toBeGreaterThan(0);
      expect(container.getAnimations().length).toBeGreaterThan(0);

      await expect.poll(() => backdrop.getAttribute("data-entering")).toBeNull();
      await expect.poll(() => container.getAttribute("data-entering")).toBeNull();

      await close(backdrop);
      result.unmount();
    });

    it("marks both elements exiting and keeps both in the document", async () => {
      const result = render();
      const backdrop = await open(result);
      const container = slot("modal-container")!;

      // After the entry has settled, so only the exit is stretched: all four assertions below have
      // to land inside it, and at the stylesheet's own duration they are racing a `userEvent` round
      // trip. None of them is about how long the exit takes.
      startSlowMotion();

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await nextTick();

      // The exit is reported to both, and both stay mounted until every animation has finished —
      // which is what lets a dialog whose own transition lives on a child still slide away.
      expect(backdrop.getAttribute("data-exiting")).toBe("true");
      expect(container.getAttribute("data-exiting")).toBe("true");
      expect(backdrop.isConnected).toBe(true);
      expect(container.isConnected).toBe(true);

      // Both, because the exit state is the union of the two: finishing only the backdrop would
      // leave the container's own animation running and prove nothing about the union.
      finishAnimations(backdrop);
      finishAnimations(container);

      await settled(backdrop);
      await nextTick();
      await nextTick();

      expect(slot("modal-backdrop")).toBeNull();

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
      // The declaration is `h-(--visual-viewport-height)`, so a missing value leaves the backdrop
      // with no height and nothing on screen.
      expect(Math.round(Number.parseFloat(style.height))).toBe(Math.round(expected));

      await close(backdrop);
      result.unmount();
    });
  });

  describe("pointer events", () => {
    it("lets a press reach the dialog but not the container around it", async () => {
      const result = render();
      const backdrop = await open(result);

      // The container is the dismiss boundary and must not swallow presses aimed past it, which
      // is what makes a press on the empty space beside the dialog dismiss the modal.
      expect(getComputedStyle(slot("modal-container")!).pointerEvents).toBe("none");
      expect(getComputedStyle(slot("modal-dialog")!).pointerEvents).toBe("auto");

      await close(backdrop);
      result.unmount();
    });

    it("closes on a real press beside the dialog", async () => {
      const result = render();
      const backdrop = await open(result);
      const dialog = slot("modal-dialog")!;
      const box = dialog.getBoundingClientRect();

      // Just above the dialog, inside the backdrop. Synthetic events cannot prove this: the
      // dismissal is decided by where the pointer really landed.
      await userEvent.click(backdrop, {
        position: { x: Math.round(box.left + box.width / 2), y: 4 },
      });
      await nextTick();
      await nextTick();

      // Polled, because both elements are held in the document until their exits have finished.
      await expect.poll(() => slot("modal-dialog")).toBeNull();

      result.unmount();
    });

    it("leaves a button inside the dialog as an ordinary button", async () => {
      const result = render({ withInsideButton: true });
      const backdrop = await open(result);
      const inside = document.body.querySelector<HTMLElement>(
        "[data-slot='modal-dialog'] [data-slot='button']",
      )!;

      // Nothing inside the modal is the trigger. Pressed with a real pointer, because that is the
      // only thing that proves the trigger's press was cleared at the boundary.
      expect(inside.getAttribute("aria-expanded")).toBeNull();
      expect(inside.getAttribute("aria-controls")).toBeNull();

      await userEvent.click(inside);
      await nextTick();
      await nextTick();

      expect(slot("modal-dialog")).toBeTruthy();

      await close(backdrop);
      result.unmount();
    });
  });

  describe("focus", () => {
    it("keeps Tab inside the dialog", async () => {
      const result = render({ withInsideButton: true });
      const backdrop = await open(result);
      const dialog = slot("modal-dialog")!;

      for (let step = 0; step < 6; step += 1) {
        await userEvent.keyboard("{Tab}");
        await nextTick();

        expect(dialog.contains(document.activeElement)).toBe(true);
      }

      await close(backdrop);
      result.unmount();
    });
  });
});
