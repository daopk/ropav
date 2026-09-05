import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { ToastQueue } from "@/components/toast";

import ToastFixture from "./fixtures.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown>) => {
  const result = renderVapor(ToastFixture, { props });

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

/** What the browser would hand a press aimed at the middle of `element`. */
const elementAtCentre = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();

  return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
};

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
  predicate: () => boolean | Promise<boolean>,
  budget = 2000,
): Promise<number> => {
  const started = performance.now();

  while (performance.now() - started < budget) {
    if (await predicate()) return Math.round(performance.now() - started);
    await nextFrame();
  }

  throw new Error(`timed out after ${budget}ms waiting for ${what}`);
};

const waitForToasts = (count: number, budget = 2000) =>
  waitUntil(`${count} toast(s)`, () => toasts().length === count, budget);

const waitForNoRegion = (budget = 2000) =>
  waitUntil("the region to go away", () => region() === null, budget);

/** The timeout the pausing tests give a toast, and the unit they advance the fake clock in. */
const TOAST_CLOCK = 400;

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

      render({ queue, width: 360 });
      queue.add({ description: "All done", title: "Saved" });
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

      render({ queue });
      queue.add({
        description: "A description long enough to make this toast taller",
        title: "Tall",
      });
      await waitForToasts(1);
      queue.add({ title: "Short" });
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

      render({ queue });
      queue.add({ title: "Saved" });
      await waitForToasts(1);

      expect(getComputedStyle(region()!.querySelector("ol")!).display).toBe("contents");
      expect(getComputedStyle(toasts()[0]!).position).toBe("absolute");
    });
  });

  describe("view transitions", () => {
    it("animates a toast in", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" });
      await waitForToasts(1);

      // The animation is the stylesheet's, driven by `view-transition-class`; what this pins is
      // that the toast is named for it, which is the half JS owns.
      expect(toasts()[0]!.style.viewTransitionName).toMatch(/^rp-toast-/);
      expect(getComputedStyle(toasts()[0]!).getPropertyValue("view-transition-class").trim()).toBe(
        "rp-toast-bottom",
      );
    });

    it("does not make one region's toasts wait behind another region's backlog", async () => {
      const first = new ToastQueue();
      const second = new ToastQueue();

      render({ placement: "top start", queue: first });
      render({ placement: "bottom end", queue: second });
      await settle();

      // A burst in the first region, then one toast in the second. With a single chain for the
      // whole document the second would not appear until the burst had finished animating, which
      // is seconds rather than frames.
      for (let index = 0; index < 6; index += 1) first.add({ title: `Burst ${index}` });
      second.add({ title: "Elsewhere" });

      // Independent chains let the second region interrupt, so its toast lands in the time one
      // transition takes rather than after all six of the first region's.
      const appeared = await waitUntil(
        "the second region's toast",
        () =>
          document.body.querySelector('.rp-toast-region--bottom-end [data-slot="toast"]') !== null,
        1500,
      );

      expect(appeared).toBeLessThan(1000);
    });
  });

  describe("interaction", () => {
    it("dismisses the toast when the close button is clicked with a real pointer", async () => {
      const queue = new ToastQueue();
      const onClose = vi.fn();

      render({ queue });
      queue.add({ title: "Saved" }, { onClose, timeout: 0 });
      await waitForToasts(1);

      // The stylesheet reveals the close button on hover and takes it out of hit testing otherwise,
      // so a press without one is not a path a user has. Asserted from a parked pointer rather than
      // assumed, since where the pointer starts is whatever the last case left behind.
      await userEvent.hover(document.documentElement);
      await nextFrame();

      expect(getComputedStyle(closeButton()).pointerEvents).toBe("none");

      /**
       * Aim until the button is really the element under its own centre.
       *
       * `pointer-events: auto` is not the same question. The button sits 6px inside the toast's
       * 24px rounded corner, so its centre is inside the toast's box but outside the toast's shape
       * — with the button not hovered, a press there falls past the rounded edge, past the region
       * that is `pointer-events: none`, and onto `<body>`. That is the whole failure: Playwright
       * reports `<body> intercepts pointer events` and retries the same doomed point until its own
       * action timeout, roughly 15s later.
       *
       * And the pointer can end up off the toast without this test moving it. The toast is
       * `position: fixed`, and a click scrolls the frame into view first — which in a full-suite
       * run of 48 frames is a scroll that actually happens, moving the toast out from under a
       * pointer parked at its centre. Re-aiming inside the poll heals that, and leaves the pointer
       * already where the click is about to land, so the click's own scroll is a no-op.
       */
      await waitUntil("the close button to be reachable by a pointer", async () => {
        await userEvent.hover(toasts()[0]!);

        return elementAtCentre(closeButton()) === closeButton();
      });

      await userEvent.click(closeButton());
      await waitForNoRegion();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("dismisses the toast when the close button is activated from the keyboard", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ title: "Saved" }, { timeout: 0 });
      await waitForToasts(1);

      // Only reachable in a real browser: jsdom does not turn Enter on a button into a click, so
      // this is the half of the keyboard path the fast suite cannot answer.
      closeButton().focus();
      await userEvent.keyboard("{Enter}");

      await waitForNoRegion();
    });

    describe("pausing", () => {
      /**
       * The toast's own clock, and nothing else.
       *
       * Waiting the timeout out on the real clock is what made the pointer half of this flaky. A
       * toast can only be shown to outlive its timeout if the timeout is shorter than the wait —
       * and the same timeout also has to survive the `userEvent` round trip and the frame polling
       * that come first, which a full-suite run stretches by whole seconds. Both halves are bets
       * on scheduling, and the first one to lose takes the clock out from under a pointer that has
       * not arrived yet: `hover` then retries against a toast mid-unmount until Playwright's own
       * action timeout, which is the ~15s failure this replaces. Advancing the clock by hand makes
       * the same statement without either bet.
       *
       * `Date` is faked *with* the timers rather than instead of them: `Timer` sets the timeout
       * with `setTimeout` but works out what a paused clock has left from `Date.now()`, so leaving
       * one of the two real would have it subtracting a real round trip from a fake delay and
       * arriving at a clock with nothing left to resume.
       *
       * What stays real is what makes this a browser test rather than a slower `jsdom` one:
       * `performance` and `requestAnimationFrame`, which the frame polling above and the view
       * transition run on, and the pointer itself.
       */
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date", "clearTimeout", "setTimeout"] });
      });

      afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
      });

      it("holds the clock while the pointer is over the stack and releases it after", async () => {
        const queue = new ToastQueue();

        render({ queue });
        queue.add({ title: "Saved" }, { timeout: TOAST_CLOCK });
        await waitForToasts(1);

        await userEvent.hover(toasts()[0]!);

        // Well past the timeout: a clock the pointer failed to reach would have fired long before
        // here, so this is the same claim the real-clock version made — the toast outlives its own
        // timeout while hovered — with the scheduler taken out of it.
        vi.advanceTimersByTime(TOAST_CLOCK * 5);

        // The queue, not the document, is what a fired clock shows up in *now*: `close` splices
        // synchronously, while the view transition keeps the toast on screen for several frames
        // afterwards — long enough that a region read on the next tick would still find one.
        expect(queue.visibleToasts).toHaveLength(1);

        await settle();
        expect(region()).not.toBeNull();

        await userEvent.unhover(toasts()[0]!);

        // Released rather than restarted: the clock picks up with what it had left, which is all
        // of it here because the only time that passed was time it spent held. So one timeout's
        // worth is exactly what it takes — and the toast really goes, through a real transition.
        vi.advanceTimersByTime(TOAST_CLOCK);
        await waitForNoRegion();
      });

      it("holds the clock while focus is inside the stack", async () => {
        const queue = new ToastQueue();

        render({ queue });
        queue.add({ title: "Saved" }, { timeout: TOAST_CLOCK });
        await waitForToasts(1);

        toasts()[0]!.focus();

        vi.advanceTimersByTime(TOAST_CLOCK * 5);

        // Reading a toast with the keyboard must not be a race against its own timeout.
        expect(queue.visibleToasts).toHaveLength(1);

        await settle();
        expect(region()).not.toBeNull();
      });
    });
  });

  describe("accessibility", () => {
    it("reports no axe violations", async () => {
      const queue = new ToastQueue();

      render({ queue });
      queue.add({ description: "All done", title: "Saved", variant: "success" });
      await waitForToasts(1);

      await expectNoA11yViolations(region()!);
    });
  });
});
