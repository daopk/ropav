import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import {ToastQueue} from "@/components/toast";

import ToastFixture from "./fixtures.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown>) => {
  const result = renderVapor(ToastFixture, {props});

  mounted.push(result);

  return result;
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const settle = async (ticks = 4) => {
  for (let index = 0; index < ticks; index += 1) await nextTick();
};

const region = () => document.body.querySelector<HTMLElement>('[data-slot="toast-region"]');

const toasts = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="toast"]')];

const closeButton = () => document.body.querySelector<HTMLElement>('button[aria-label="Close"]')!;

/**
 * Poll rather than count ticks.
 *
 * A real view transition defers the DOM mutation until the browser is ready to snapshot and then
 * animates for as long as the stylesheet says, so a toast is not in the document on the tick after
 * `add` — nor is it *out* of the document on the tick after it closes. This is the one thing that
 * makes browser assertions here different from the jsdom suite, where the transition API is absent
 * and every change lands synchronously.
 */
const waitUntil = async (
  what: string,
  predicate: () => boolean,
  budget = 2000,
): Promise<number> => {
  const started = performance.now();

  while (performance.now() - started < budget) {
    if (predicate()) return Math.round(performance.now() - started);
    await nextFrame();
  }

  throw new Error(`timed out after ${budget}ms waiting for ${what}`);
};

const waitForToasts = (count: number, budget = 2000) =>
  waitUntil(`${count} toast(s)`, () => toasts().length === count, budget);

const waitForNoRegion = (budget = 2000) =>
  waitUntil("the region to go away", () => region() === null, budget);

describe("Toast (browser)", () => {
  afterEach(() => {
    while (mounted.length > 0) {
      try {
        mounted.pop()!.unmount();
      } catch {
        /* already unmounted */
      }
    }
    document.body.innerHTML = "";
  });

  describe("layout", () => {
    it("pins the region to the placement edge and sizes it from the declared width", async () => {
      const queue = new ToastQueue();

      render({queue, width: 360});
      queue.add({description: "All done", title: "Saved"});
      await waitForToasts(1);

      const styles = getComputedStyle(region()!);

      expect(styles.position).toBe("fixed");
      expect(styles.getPropertyValue("--toast-width").trim()).toBe("360px");
      // The region must not swallow presses meant for the page behind it.
      expect(styles.pointerEvents).toBe("none");
      expect(getComputedStyle(toasts()[0]!).pointerEvents).toBe("auto");
    });

    it("clips a stacked toast to the height of the one in front of it", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({
        description: "A description long enough to make this toast taller",
        title: "Tall",
      });
      await waitForToasts(1);
      queue.add({title: "Short"});
      await waitForToasts(2);
      await settle();

      const [front, behind] = toasts();
      const frontHeight = front!.offsetHeight;

      // The stylesheet sizes a stacked toast from `--front-height`, so the number measured off the
      // front toast has to have travelled up to the region and back down as an inline property.
      expect(behind!.style.getPropertyValue("--front-height")).toBe(`${frontHeight}px`);
      expect(getComputedStyle(behind!).overflow).toBe("hidden");

      // Layout height, not the painted rect: the stack scales each toast down, so the rect is
      // deliberately smaller than the box it was clipped to. Asserting the rect here would be
      // asserting the scale by accident and would move whenever the scale factor changed.
      expect(behind!.offsetHeight).toBe(frontHeight);
      expect(behind!.getBoundingClientRect().height).toBeCloseTo(frontHeight * 0.95, 0);
    });

    it("keeps the list out of the layout so the stack is positioned by the stylesheet", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({title: "Saved"});
      await waitForToasts(1);

      expect(getComputedStyle(region()!.querySelector("ol")!).display).toBe("contents");
      expect(getComputedStyle(toasts()[0]!).position).toBe("absolute");
    });
  });

  describe("view transitions", () => {
    it("animates a toast in", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({title: "Saved"});
      await waitForToasts(1);

      // The animation is the stylesheet's, driven by `view-transition-class`; what this pins is
      // that the toast is named for it, which is the half JS owns.
      expect(toasts()[0]!.style.viewTransitionName).toMatch(/^toast-/);
      expect(getComputedStyle(toasts()[0]!).getPropertyValue("view-transition-class").trim()).toBe(
        "toast-bottom",
      );
    });

    it("does not make one region's toasts wait behind another region's backlog", async () => {
      const first = new ToastQueue();
      const second = new ToastQueue();

      render({placement: "top start", queue: first});
      render({placement: "bottom end", queue: second});
      await settle();

      // A burst in the first region, then one toast in the second. With a single chain for the
      // whole document the second would not appear until the burst had finished animating, which
      // is seconds rather than frames.
      for (let index = 0; index < 6; index += 1) first.add({title: `Burst ${index}`});
      second.add({title: "Elsewhere"});

      // Independent chains let the second region interrupt, so its toast lands in the time one
      // transition takes rather than after all six of the first region's.
      const appeared = await waitUntil(
        "the second region's toast",
        () => document.body.querySelector('.toast-region--bottom-end [data-slot="toast"]') !== null,
        1500,
      );

      expect(appeared).toBeLessThan(1000);
    });
  });

  describe("interaction", () => {
    it("dismisses the toast when the close button is clicked with a real pointer", async () => {
      const queue = new ToastQueue();
      const onClose = vi.fn();

      render({queue});
      queue.add({title: "Saved"}, {onClose, timeout: 0});
      await waitForToasts(1);

      // The close button is `opacity: 0` and `pointer-events: none` until the frontmost toast is
      // hovered — the stylesheet reveals it on hover, so a click without one is not a path a user
      // has, and Playwright refuses it for the same reason.
      await userEvent.hover(toasts()[0]!);
      await waitUntil(
        "the close button to be revealed",
        () => getComputedStyle(closeButton()).pointerEvents === "auto",
      );

      await userEvent.click(closeButton());
      await waitForNoRegion();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("dismisses the toast when the close button is activated from the keyboard", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({title: "Saved"}, {timeout: 0});
      await waitForToasts(1);

      // Only reachable in a real browser: jsdom does not turn Enter on a button into a click, so
      // this is the half of the keyboard path the fast suite cannot answer.
      closeButton().focus();
      await userEvent.keyboard("{Enter}");

      await waitForNoRegion();
    });

    it("holds the clock while the pointer is over the stack and releases it after", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({title: "Saved"}, {timeout: 400});
      await waitForToasts(1);

      await userEvent.hover(toasts()[0]!);

      // A real clock: the point is that the toast outlives its own timeout while hovered.
      await new Promise((resolve) => setTimeout(resolve, 900));
      await settle();
      expect(region()).not.toBeNull();

      await userEvent.unhover(toasts()[0]!);

      await waitForNoRegion();
    });

    it("holds the clock while focus is inside the stack", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({title: "Saved"}, {timeout: 400});
      await waitForToasts(1);

      toasts()[0]!.focus();

      await new Promise((resolve) => setTimeout(resolve, 900));
      await settle();

      // Reading a toast with the keyboard must not be a race against its own timeout.
      expect(region()).not.toBeNull();
    });
  });

  describe("accessibility", () => {
    it("reports no axe violations", async () => {
      const queue = new ToastQueue();

      render({queue});
      queue.add({description: "All done", title: "Saved", variant: "success"});
      await waitForToasts(1);

      await expectNoA11yViolations(region()!);
    });
  });
});
