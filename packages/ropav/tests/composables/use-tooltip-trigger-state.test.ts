import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {effectScope, shallowRef} from "vue";

import {
  getRegisteredTooltipCount,
  resetTooltipWarmup,
  useTooltipTriggerState,
} from "@/composables/use-tooltip-trigger-state";

type Options = Parameters<typeof useTooltipTriggerState>[0];

/** Run the state in a disposable scope, mirroring a component lifetime. */
const setup = (options: Options = {}) => {
  const scope = effectScope();
  const changes: boolean[] = [];
  const state = scope.run(() =>
    useTooltipTriggerState({onOpenChange: (isOpen) => changes.push(isOpen), ...options}),
  )!;

  return {changes, dispose: () => scope.stop(), state};
};

describe("useTooltipTriggerState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // The registry and both global timers outlive every component, so a case that left a tooltip
    // warm would make the next test open with no delay and read as a bug there instead.
    resetTooltipWarmup();
  });

  describe("delay", () => {
    it("waits out the delay before opening", () => {
      const {dispose, state} = setup({delay: 1500});

      state.open();
      expect(state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1499);
      expect(state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1);
      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("opens at once when asked to", () => {
      const {dispose, state} = setup({delay: 1500});

      // Keyboard focus takes this path: a tooltip earned by tabbing should not make the user wait.
      state.open(true);

      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("opens at once with no delay configured", () => {
      const {dispose, state} = setup({delay: 0});

      state.open();

      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("drops a pending open when the pointer leaves first", () => {
      const {changes, dispose, state} = setup({closeDelay: 500, delay: 1500});

      state.open();
      vi.advanceTimersByTime(1000);
      // The pointer left before the tooltip had earned its place.
      state.close();
      vi.advanceTimersByTime(2000);

      // A tooltip that appears after the pointer has gone is worse than no tooltip: it covers
      // whatever the user moved on to.
      expect(state.isOpen.value).toBe(false);
      expect(changes).toEqual([]);

      dispose();
    });

    it("restarts the wait rather than stacking two", () => {
      const {dispose, state} = setup({delay: 1500});

      state.open();
      vi.advanceTimersByTime(1000);
      // Chrome can report hover twice for one pointer entering, so this path is real.
      state.open();

      vi.advanceTimersByTime(500);
      expect(state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(state.isOpen.value).toBe(true);

      dispose();
    });

    it("animates the first tooltip in", () => {
      const {dispose, state} = setup({delay: 1500});

      state.open();
      vi.advanceTimersByTime(1500);

      expect(state.isOpen.value).toBe(true);
      expect(state.shouldSkipAnimation.value).toBe(false);

      dispose();
    });
  });

  describe("close delay", () => {
    it("waits out the close delay before closing", () => {
      const {dispose, state} = setup({closeDelay: 500, delay: 0});

      state.open();
      state.close();

      expect(state.isOpen.value).toBe(true);

      vi.advanceTimersByTime(499);
      expect(state.isOpen.value).toBe(true);

      vi.advanceTimersByTime(1);
      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("closes at once when asked to", () => {
      const {dispose, state} = setup({closeDelay: 500, delay: 0});

      state.open();
      state.close(true);

      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("closes at once with no close delay configured", () => {
      const {dispose, state} = setup({closeDelay: 0, delay: 0});

      state.open();
      state.close();

      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("keeps the pending close rather than restarting it", () => {
      const {dispose, state} = setup({closeDelay: 500, delay: 0});

      state.open();
      state.close();
      vi.advanceTimersByTime(400);
      // A second request must not push the close back, or a pointer jittering just off the trigger
      // would hold the tooltip open indefinitely.
      state.close();
      vi.advanceTimersByTime(100);

      expect(state.isOpen.value).toBe(false);

      dispose();
    });

    it("cancels a pending close when it reopens", () => {
      const {dispose, state} = setup({closeDelay: 500, delay: 0});

      state.open();
      state.close();
      vi.advanceTimersByTime(400);
      state.open(true);
      vi.advanceTimersByTime(200);

      expect(state.isOpen.value).toBe(true);

      dispose();
    });
  });

  describe("shared warmup", () => {
    it("opens the second tooltip at once while one is on screen", () => {
      const first = setup({delay: 1500});
      const second = setup({delay: 1500});

      first.state.open();
      vi.advanceTimersByTime(1500);
      expect(first.state.isOpen.value).toBe(true);

      // The pointer has moved to a neighbouring trigger. Nothing waits this time.
      second.state.open();

      expect(second.state.isOpen.value).toBe(true);
      expect(second.state.shouldSkipAnimation.value).toBe(true);

      first.dispose();
      second.dispose();
    });

    it("closes the tooltip it replaces at once", () => {
      const first = setup({closeDelay: 500, delay: 1500});
      const second = setup({closeDelay: 500, delay: 1500});

      first.state.open();
      vi.advanceTimersByTime(1500);
      second.state.open();

      // Instantly, not after the close delay: two tooltips fading past each other reads as a
      // glitch where a straight swap reads as the label following the pointer.
      expect(first.state.isOpen.value).toBe(false);
      expect(second.state.isOpen.value).toBe(true);

      first.dispose();
      second.dispose();
    });

    it("waits again once the cooldown has run out", () => {
      const first = setup({closeDelay: 500, delay: 1500});
      const second = setup({delay: 1500});

      first.state.open();
      vi.advanceTimersByTime(1500);
      first.state.close(true);

      // The cooldown is `max(500, closeDelay)` from the close.
      vi.advanceTimersByTime(500);

      second.state.open();
      expect(second.state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1500);
      expect(second.state.isOpen.value).toBe(true);

      first.dispose();
      second.dispose();
    });

    it("measures the cooldown against the floor, not the tooltip's own close delay", () => {
      const first = setup({closeDelay: 10, delay: 1500});
      const second = setup({delay: 1500});

      first.state.open();
      vi.advanceTimersByTime(1500);
      first.state.close(true);

      // A tooltip that closes fast must not shorten the window in which the next appears at once.
      vi.advanceTimersByTime(100);
      second.state.open();

      expect(second.state.isOpen.value).toBe(true);

      first.dispose();
      second.dispose();
    });

    it("cancels the pending warmup when another tooltip takes over", () => {
      const first = setup({delay: 1500});
      const second = setup({delay: 1500});

      first.state.open();
      vi.advanceTimersByTime(1000);
      // The pointer left the first trigger for the second before either had earned its tooltip.
      second.state.open();
      vi.advanceTimersByTime(500);

      // The first tooltip's warmup has to be gone, not merely superseded.
      expect(first.state.isOpen.value).toBe(false);
      expect(second.state.isOpen.value).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(second.state.isOpen.value).toBe(true);
      expect(first.state.isOpen.value).toBe(false);

      first.dispose();
      second.dispose();
    });
  });

  describe("lifetime", () => {
    it("leaves nothing in the registry when it goes away", () => {
      const before = getRegisteredTooltipCount();
      const {dispose, state} = setup({delay: 0});

      state.open();
      expect(getRegisteredTooltipCount()).toBe(before + 1);

      dispose();

      // A leaked entry would keep closing a tooltip that no longer exists, and would hold the page
      // warm forever.
      expect(getRegisteredTooltipCount()).toBe(before);
    });

    it("drops a pending close when it goes away", () => {
      const {dispose, state} = setup({closeDelay: 500, delay: 0});

      state.open();
      state.close();
      dispose();

      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    });
  });

  describe("controlled", () => {
    it("reports the change rather than opening itself", () => {
      const isOpen = shallowRef(false);
      const {changes, dispose, state} = setup({delay: 0, isOpen});

      state.open();

      expect(changes).toEqual([true]);
      expect(state.isOpen.value).toBe(false);

      isOpen.value = true;
      expect(state.isOpen.value).toBe(true);

      dispose();
    });
  });
});
