import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, shallowRef} from "vue";

import {
  Timer,
  ToastQueue,
  createToastFunction,
  getQueuedToastCount,
  resetToastQueue,
  toast,
  toastQueue,
  useToastQueue,
} from "@/components/toast/toast-queue";
import {DEFAULT_TOAST_TIMEOUT} from "@/components/toast/toast.constants";

/** Read outside a component: nothing here depends on an instance. */
const read = <T>(body: () => T): {stop: () => void; value: T} => {
  const scope = effectScope();
  const value = scope.run(body)!;

  return {stop: () => scope.stop(), value};
};

const titles = (queue: ToastQueue) => queue.visibleToasts.map((entry) => entry.content.title);

describe("ToastQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetToastQueue();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("ordering", () => {
    it("exposes the newest toast first", () => {
      const queue = new ToastQueue();

      queue.add({title: "First"});
      queue.add({title: "Second"});

      // Index 0 is the frontmost toast, which is what the stack offsets and z-index are built on.
      expect(titles(queue)).toEqual(["Second", "First"]);
    });

    it("keeps every toast regardless of maxVisibleToasts", () => {
      const queue = new ToastQueue({maxVisibleToasts: 1});

      queue.add({title: "First"});
      queue.add({title: "Second"});

      // The cap is a hint the region reads: a toast past it is faded out, not dropped, so it can
      // come back when the ones in front close.
      expect(titles(queue)).toEqual(["Second", "First"]);
      expect(queue.maxVisibleToasts).toBe(1);
    });

    it("returns the key it assigned", () => {
      const queue = new ToastQueue();
      const key = queue.add({title: "First"});

      expect(queue.visibleToasts[0]?.key).toBe(key);
    });
  });

  describe("timeouts", () => {
    it("closes a toast after the default timeout", () => {
      const queue = new ToastQueue();

      queue.add({title: "First"});
      queue.visibleToasts[0]!.timer!.reset(DEFAULT_TOAST_TIMEOUT);

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT - 1);
      // Asserted still alive first: "gone after the timeout" alone cannot tell a running clock
      // from a toast that never had one.
      expect(queue.visibleToasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("creates no timer for a timeout of zero", () => {
      const queue = new ToastQueue();

      queue.add({title: "First"}, {timeout: 0});

      expect(queue.visibleToasts[0]?.timer).toBeUndefined();

      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 10);
      expect(queue.visibleToasts).toHaveLength(1);
    });

    it("does not start the clock until the toast asks it to", () => {
      const queue = new ToastQueue();

      queue.add({title: "First"});

      // The toast starts its own clock when it mounts, so one queued while nothing is rendered has
      // not already spent its life waiting.
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
      expect(queue.visibleToasts).toHaveLength(1);
    });

    it("resumes a paused toast with only the time it had left", () => {
      const queue = new ToastQueue();

      queue.add({title: "First"});
      queue.visibleToasts[0]!.timer!.reset(1000);

      vi.advanceTimersByTime(400);
      queue.pauseAll();

      vi.advanceTimersByTime(5000);
      expect(queue.visibleToasts).toHaveLength(1);

      queue.resumeAll();
      vi.advanceTimersByTime(599);
      expect(queue.visibleToasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(queue.visibleToasts).toHaveLength(0);
    });
  });

  describe("closing", () => {
    it("calls onClose for a toast it closes", () => {
      const queue = new ToastQueue();
      const onClose = vi.fn();
      const key = queue.add({title: "First"}, {onClose});

      queue.close(key);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("does not call onClose for a toast cleared away", () => {
      const queue = new ToastQueue();
      const onClose = vi.fn();

      queue.add({title: "First"}, {onClose});
      queue.clear();

      // Nothing closed it, so nothing is reported — the same split `react-stately` draws.
      expect(onClose).not.toHaveBeenCalled();
      expect(queue.visibleToasts).toHaveLength(0);
    });

    it("notifies subscribers for a key it no longer holds", () => {
      const queue = new ToastQueue();
      const onChange = vi.fn();

      queue.subscribe(onChange);
      queue.close("_missing");

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscriptions", () => {
    it("notifies on add, close and clear", () => {
      const queue = new ToastQueue();
      const onChange = vi.fn();

      queue.subscribe(onChange);

      const key = queue.add({title: "First"});

      expect(onChange).toHaveBeenCalledTimes(1);

      queue.close(key);
      expect(onChange).toHaveBeenCalledTimes(2);

      queue.clear();
      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("stops notifying an unsubscribed listener", () => {
      const queue = new ToastQueue();
      const onChange = vi.fn();
      const unsubscribe = queue.subscribe(onChange);

      unsubscribe();
      queue.add({title: "First"});

      expect(onChange).not.toHaveBeenCalled();
    });

    it("wraps every update in the supplied wrapUpdate, reporting why", () => {
      const actions: string[] = [];
      const queue = new ToastQueue({
        wrapUpdate: (fn, action) => {
          actions.push(action);
          fn();
        },
      });

      const key = queue.add({title: "First"});

      queue.close(key);
      queue.clear();

      expect(actions).toEqual(["add", "remove", "clear"]);
    });
  });
});

describe("useToastQueue", () => {
  it("follows the queue it is given", () => {
    const queue = new ToastQueue();
    const {stop, value} = read(() => useToastQueue(queue));

    expect(value.visibleToasts.value).toEqual([]);

    queue.add({title: "First"});
    expect(value.visibleToasts.value.map((entry) => entry.content.title)).toEqual(["First"]);

    stop();
  });

  it("switches queues and stops following the old one", async () => {
    const first = new ToastQueue();
    const second = new ToastQueue();
    const queue = shallowRef(first);
    const {stop, value} = read(() => useToastQueue(queue));

    first.add({title: "First"});
    expect(value.visibleToasts.value).toHaveLength(1);

    queue.value = second;
    await nextTick();
    expect(value.visibleToasts.value).toHaveLength(0);

    first.add({title: "Ignored"});
    expect(value.visibleToasts.value).toHaveLength(0);

    stop();
  });

  it("stops following when the scope is disposed", () => {
    const queue = new ToastQueue();
    const {stop, value} = read(() => useToastQueue(queue));

    stop();
    queue.add({title: "First"});

    expect(value.visibleToasts.value).toHaveLength(0);
  });
});

describe("toast", () => {
  afterEach(() => {
    resetToastQueue();
  });

  it("adds the message as the title with the default variant", () => {
    toast("Saved");

    const [entry] = toastQueue.visibleToasts;

    expect(entry?.content).toMatchObject({title: "Saved", variant: "default"});
    expect(getQueuedToastCount()).toBe(1);
  });

  it("maps each variant helper to its variant", () => {
    const queue = new ToastQueue();
    const scoped = createToastFunction(queue);

    scoped.success("a");
    scoped.warning("b");
    scoped.danger("c");
    // `info` is the outlier and it is deliberate: `@heroui/react` names the helper `info` and
    // gives it the accent variant, because there is no `info` variant to give it.
    scoped.info("d");

    expect(queue.visibleToasts.map((entry) => entry.content.variant)).toEqual([
      "accent",
      "danger",
      "warning",
      "success",
    ]);
  });

  it("carries description, indicator and action through to the content", () => {
    const queue = new ToastQueue();
    const scoped = createToastFunction(queue);
    const onPress = vi.fn();

    scoped("Saved", {
      actionProps: {label: "Undo", onPress},
      description: "All done",
      indicator: null,
    });

    expect(queue.visibleToasts[0]?.content).toMatchObject({
      actionProps: {label: "Undo", onPress},
      description: "All done",
      indicator: null,
    });
  });

  it("reports onClose a frame after the removal rather than during it", async () => {
    const queue = new ToastQueue();
    const scoped = createToastFunction(queue);
    const onClose = vi.fn();
    const key = scoped("Saved", {onClose});

    scoped.close(key);

    // Deferred so the callback runs after the removal it reports has been painted, not in the
    // middle of it — the same frame `@heroui/react` waits.
    expect(onClose).not.toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("closes and clears through the queue behind it", () => {
    const queue = new ToastQueue();
    const scoped = createToastFunction(queue);
    const key = scoped("Saved");

    expect(scoped.getQueue()).toBe(queue);

    scoped.close(key);
    expect(queue.visibleToasts).toHaveLength(0);

    scoped("One");
    scoped("Two");
    scoped.clear();
    expect(queue.visibleToasts).toHaveLength(0);
  });

  describe("promise", () => {
    it("shows a persistent loading toast and returns its key synchronously", () => {
      const queue = new ToastQueue();
      const scoped = createToastFunction(queue);
      const key = scoped.promise(new Promise(() => {}), {
        error: "Failed",
        loading: "Saving",
        success: "Saved",
      });

      const [entry] = queue.visibleToasts;

      expect(entry?.key).toBe(key);
      expect(entry?.content).toMatchObject({isLoading: true, title: "Saving"});
      expect(entry?.timer).toBeUndefined();
    });

    it("replaces the loading toast with a success toast built from the value", async () => {
      const queue = new ToastQueue();
      const scoped = createToastFunction(queue);

      scoped.promise(Promise.resolve(3), {
        error: "Failed",
        loading: "Saving",
        success: (count: number) => `Saved ${count}`,
      });

      await vi.waitFor(() => {
        expect(queue.visibleToasts).toHaveLength(1);
        expect(queue.visibleToasts[0]?.content).toMatchObject({
          title: "Saved 3",
          variant: "success",
        });
      });
    });

    it("replaces the loading toast with a danger toast built from the error", async () => {
      const queue = new ToastQueue();
      const scoped = createToastFunction(queue);

      scoped.promise(Promise.reject(new Error("nope")), {
        error: (error: Error) => `Failed: ${error.message}`,
        loading: "Saving",
        success: "Saved",
      });

      await vi.waitFor(() => {
        expect(queue.visibleToasts).toHaveLength(1);
        expect(queue.visibleToasts[0]?.content).toMatchObject({
          title: "Failed: nope",
          variant: "danger",
        });
      });
    });

    it("accepts a factory so the promise is not started before the toast exists", () => {
      const queue = new ToastQueue();
      const scoped = createToastFunction(queue);
      const start = vi.fn(() => Promise.resolve("ok"));

      scoped.promise(start, {error: "Failed", loading: "Saving", success: "Saved"});

      expect(start).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not run until reset starts it", () => {
    const callback = vi.fn();

    new Timer(callback, 100);

    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });

  it("ignores a pause when it is not running", () => {
    const callback = vi.fn();
    const timer = new Timer(callback, 100);

    timer.pause();
    timer.reset(100);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("ignores a resume once it has already fired", () => {
    const callback = vi.fn();
    const timer = new Timer(callback, 100);

    timer.reset(100);
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    timer.resume();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
