import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { ToastQueue } from "@/components/toast/toast-queue";
import { DEFAULT_TOAST_TIMEOUT } from "@/components/toast/toast.constants";

import ToastHost from "../fixtures/toast-host.vue";

const mounted: { unmount: () => void }[] = [];

const render = (props: Record<string, unknown>) => {
  const result = renderVapor(ToastHost, { props });

  mounted.push(result);

  return result;
};

/** One queued toast, taken from a real queue so its clock is the real one. */
const queueOne = (options: { onClose?: () => void; timeout?: number } = {}) => {
  const queue = new ToastQueue();

  queue.add({ title: "Saved" }, options);

  return { queue, toast: queue.visibleToasts[0]! };
};

describe("useToast", () => {
  afterEach(() => {
    while (mounted.length > 0) {
      try {
        mounted.pop()!.unmount();
      } catch {
        /* already unmounted */
      }
    }
  });

  describe("accessibility", () => {
    it("exposes the toast as a non-modal alert dialog", () => {
      const { toast } = queueOne();
      const { getByTestId } = render({ toast });
      const element = getByTestId("toast");

      // A toast holds controls, so it has to be a dialog for a screen reader to let the user in,
      // and a non-modal one because the rest of the page stays live.
      expect(element).toHaveAttribute("role", "alertdialog");
      expect(element).toHaveAttribute("aria-modal", "false");
    });

    it("labels the toast with its title", () => {
      const { toast } = queueOne();
      const { getByTestId } = render({ toast });

      expect(getByTestId("toast").getAttribute("aria-labelledby")).toBe(
        getByTestId("title").getAttribute("id"),
      );
    });

    it("describes the toast only once a description claims the id", async () => {
      const { toast } = queueOne();
      const without = render({ toast });

      await nextTick();
      expect(without.getByTestId("toast")).not.toHaveAttribute("aria-describedby");

      const withDescription = render({ showDescription: true, toast });

      await nextTick();
      expect(withDescription.getByTestId("toast").getAttribute("aria-describedby")).toBe(
        withDescription.getByTestId("description").getAttribute("id"),
      );
    });

    it("announces through the content rather than the dialog", () => {
      const { toast } = queueOne();
      const { getByTestId } = render({ toast });
      const content = getByTestId("content");

      expect(content).toHaveAttribute("role", "alert");
      expect(content).toHaveAttribute("aria-atomic", "true");
    });

    it("withholds the content from the accessibility tree for the first tick only", async () => {
      const { toast } = queueOne();
      const { getByTestId } = render({ toast });

      // Both halves are asserted on purpose: "no aria-hidden afterwards" alone stays green if the
      // flag is deleted outright, and the flag exists because NVDA announces nothing unless the
      // alert becomes visible *after* it exists.
      expect(getByTestId("content")).toHaveAttribute("aria-hidden", "true");

      await nextTick();
      expect(getByTestId("content")).not.toHaveAttribute("aria-hidden");
    });
  });

  describe("timing", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it("starts the clock when the toast mounts, not when it was queued", () => {
      const { queue, toast } = queueOne();

      // Nothing is rendered yet, so nothing should be counting down.
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      expect(queue.visibleToasts).toHaveLength(1);

      render({ toast });

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT - 1);
      expect(queue.visibleToasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("pauses the clock when the toast unmounts", () => {
      const { queue, toast } = queueOne();
      const result = render({ toast });

      vi.advanceTimersByTime(1000);
      result.unmount();

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      // Paused rather than dropped, so a toast that comes back has the time it had left.
      expect(queue.visibleToasts).toHaveLength(1);
    });

    it("starts no clock for a toast that never expires", () => {
      const { queue, toast } = queueOne({ timeout: 0 });

      render({ toast });

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 10);
      expect(queue.visibleToasts).toHaveLength(1);
    });
  });

  describe("closing", () => {
    it("closes through the callback it was handed", () => {
      const onClose = vi.fn();
      const { toast } = queueOne({ onClose });
      const api: { close: () => void }[] = [];

      render({ onReady: (next: { close: () => void }) => api.push(next), toast });

      api[0]!.close();

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
