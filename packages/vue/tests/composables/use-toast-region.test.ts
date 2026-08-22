import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {nextTick} from "vue";

import {ToastQueue} from "@/components/toast/toast-queue";
import {DEFAULT_TOAST_TIMEOUT} from "@/components/toast/toast.constants";
import {setInteractionModality} from "@/composables/use-interaction-states";

import ToastRegionHost from "../fixtures/toast-region-host.vue";

const mounted: {unmount: () => void}[] = [];

const render = (props: Record<string, unknown>) => {
  const result = renderVapor(ToastRegionHost, {props});

  mounted.push(result);

  return result;
};

const POINTER = {bubbles: true, pointerType: "mouse"} as const;

const hoverIn = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerenter", POINTER));
};

const hoverOut = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerleave", POINTER));
};

/** A queue whose toasts have running clocks, so pausing is observable. */
const queueWith = (titles: string[]) => {
  const queue = new ToastQueue();

  for (const title of titles) queue.add({title});
  for (const entry of queue.visibleToasts) entry.timer!.reset(DEFAULT_TOAST_TIMEOUT);

  return queue;
};

const toastFor = (container: HTMLElement, title: string) =>
  [...container.querySelectorAll<HTMLElement>('[role="alertdialog"]')].find(
    (element) => element.textContent?.trim() === title,
  )!;

describe("useToastRegion", () => {
  beforeEach(() => {
    setInteractionModality("keyboard");
  });

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

  describe("landmark", () => {
    it("exposes a region marked as a top layer and out of the tab order", () => {
      const {getByTestId} = render({queue: queueWith(["First"])});
      const region = getByTestId("region");

      expect(region).toHaveAttribute("role", "region");
      expect(region).toHaveAttribute("tabindex", "-1");
      // The marker `ariaHideOutside` looks for, so an open modal does not hide the toasts behind it.
      expect(region).toHaveAttribute("data-heroui-top-layer");
    });

    it("names the region with how many notifications it holds", async () => {
      const queue = queueWith(["First"]);
      const {getByTestId} = render({queue});

      expect(getByTestId("region")).toHaveAttribute("aria-label", "1 notification.");

      queue.add({title: "Second"});
      await nextTick();

      expect(getByTestId("region")).toHaveAttribute("aria-label", "2 notifications.");
    });

    it("supports an explicit label instead of the count", () => {
      const {getByTestId} = render({ariaLabel: "Alerts", queue: queueWith(["First"])});

      expect(getByTestId("region")).toHaveAttribute("aria-label", "Alerts");
    });
  });

  describe("pausing", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it("pauses every visible clock while the pointer is inside", () => {
      const queue = queueWith(["First"]);
      const {getByTestId} = render({queue});

      hoverIn(getByTestId("region"));

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      expect(queue.visibleToasts).toHaveLength(1);

      hoverOut(getByTestId("region"));

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT);
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("pauses every visible clock while focus is inside", () => {
      const queue = queueWith(["First"]);
      const {container, getByTestId} = render({queue});

      toastFor(container, "First").focus();

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      expect(queue.visibleToasts).toHaveLength(1);

      getByTestId("region").dispatchEvent(new FocusEvent("focusout", {bubbles: true}));

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT);
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("stays paused when the pointer leaves but focus is still inside", () => {
      const queue = queueWith(["First"]);
      const {container, getByTestId} = render({queue});

      hoverIn(getByTestId("region"));
      toastFor(container, "First").focus();
      hoverOut(getByTestId("region"));

      // Either reason on its own is enough to hold the clock, which is why they are one decision
      // rather than two independent switches.
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      expect(queue.visibleToasts).toHaveLength(1);
    });
  });

  describe("focus recovery", () => {
    it("hands focus to the toast that took the removed one's place", async () => {
      const queue = queueWith(["First", "Second"]);
      const {container} = render({queue});

      const frontmost = toastFor(container, "Second");

      frontmost.focus();
      await nextTick();

      queue.close(queue.visibleToasts[0]!.key);
      await nextTick();

      // Focus follows the stack rather than falling to `<body>`, which is where a screen reader
      // would otherwise lose the user.
      expect(document.activeElement).toBe(toastFor(container, "First"));
    });

    it("pushes focus back out of the region under a pointer", async () => {
      const queue = queueWith(["First", "Second"]);
      const outside = document.createElement("button");

      document.body.append(outside);

      const {container} = render({queue});

      outside.focus();
      setInteractionModality("pointer");
      toastFor(container, "Second").focus();
      await nextTick();

      queue.close(queue.visibleToasts[0]!.key);
      await nextTick();

      // A pointer user who has moved on would otherwise hold every remaining clock paused with
      // focus they never asked for, and the toasts would look stuck.
      expect(document.activeElement).toBe(outside);
    });

    it("leaves focus alone when the removed toast did not have it", async () => {
      const queue = queueWith(["First", "Second"]);
      const outside = document.createElement("button");

      document.body.append(outside);
      render({queue});
      outside.focus();

      queue.close(queue.visibleToasts[0]!.key);
      await nextTick();

      expect(document.activeElement).toBe(outside);
    });

    it("restores focus to where it came from once the region empties", async () => {
      const queue = queueWith(["First"]);
      const outside = document.createElement("button");

      document.body.append(outside);

      const {container} = render({queue});

      outside.focus();
      toastFor(container, "First").focus();
      await nextTick();

      queue.clear();
      await nextTick();

      expect(document.activeElement).toBe(outside);
    });
  });
});
