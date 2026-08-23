import type {
  QueuedToast,
  ToastAction,
  ToastAddOptions,
  ToastContentValue,
  ToastOptions,
  ToastPromiseOptions,
  ToastQueueOptions,
  ToastRenderable,
} from "./toast.types";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, nextTick, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { DEFAULT_TOAST_TIMEOUT } from "./toast.constants";

/* -------------------------------------------------------------------------------------------------
 * Timer
 * -----------------------------------------------------------------------------------------------*/
/**
 * A `setTimeout` that can be paused and picked up where it left off.
 *
 * Constructing one does not start it — the toast starts its own clock when it mounts, so a toast
 * queued while the region is hidden has not already spent its life waiting to be rendered.
 */
export class Timer {
  private readonly callback: () => void;
  private remaining: number;
  private startTime: number | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(callback: () => void, delay: number) {
    this.callback = callback;
    this.remaining = delay;
  }

  reset(delay: number): void {
    this.remaining = delay;
    this.resume();
  }

  pause(): void {
    if (this.timerId == null) return;

    clearTimeout(this.timerId);
    this.timerId = null;
    this.remaining -= Date.now() - this.startTime!;
  }

  resume(): void {
    if (this.remaining <= 0) return;

    this.startTime = Date.now();
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.remaining = 0;
      this.callback();
    }, this.remaining);
  }
}

/* -------------------------------------------------------------------------------------------------
 * Queue
 * -----------------------------------------------------------------------------------------------*/
/**
 * The order toasts are shown in, and the clocks that close them.
 *
 * Ported from `react-stately`'s `ToastQueue`, merged with the wrapper that normally sits around
 * it. Upstream those are two classes because the wrapper had a primitive to wrap; writing both
 * here means keeping them apart would be two paths doing one job. What the merge keeps from the
 * wrapper: the default timeout, the serialized view transition, and `maxVisibleToasts` as a hint
 * the region reads rather than a truncation.
 *
 * Deliberately free of Vue: reactivity lives in `useToastQueue`, so the module-level singleton
 * holds no reactive state and the queue is testable without mounting anything.
 */
export class ToastQueue<T = ToastContentValue> {
  private queue: QueuedToast<T>[] = [];
  private readonly subscriptions = new Set<() => void>();
  private readonly wrapUpdate: (fn: () => void, action: ToastAction) => void;

  /** How many toasts the region should draw at once, if the region does not say. */
  readonly maxVisibleToasts?: number;

  /** Every toast currently held, newest first. */
  visibleToasts: QueuedToast<T>[] = [];

  constructor(options: ToastQueueOptions = {}) {
    this.maxVisibleToasts = options.maxVisibleToasts;

    const transitions = createViewTransitionUpdate();

    this.resetTransitions = transitions.reset;
    this.wrapUpdate = options.wrapUpdate ?? transitions.wrapUpdate;
  }

  /** Forgets any transitions still queued. For a test, since a chain outlives a mount. */
  readonly resetTransitions: () => void;

  /** Adds a toast and returns its key. */
  add(content: T, options: ToastOptions = {}): string {
    const key = `_${Math.random().toString(36).slice(2)}`;

    // An explicit `0` is kept: that is how a toast is asked to stay until something closes it.
    const timeout = options.timeout ?? DEFAULT_TOAST_TIMEOUT;

    this.queue.unshift({
      ...options,
      content,
      key,
      timeout,
      timer: timeout ? new Timer(() => this.close(key), timeout) : undefined,
    });

    this.update("add");

    return key;
  }

  /** Closes one toast. Notifies even for a key that is no longer held. */
  close(key: string): void {
    const index = this.queue.findIndex((toast) => toast.key === key);

    if (index >= 0) {
      // Announced before the splice, so a handler reading the queue still sees the toast it is
      // being told about.
      this.queue[index]!.onClose?.();
      this.queue.splice(index, 1);
    }

    this.update("remove");
  }

  /** Drops every toast at once. Deliberately does not run their `onClose` — nothing closed them. */
  clear(): void {
    this.queue = [];
    this.update("clear");
  }

  /** Stops the clocks of the toasts on screen. */
  pauseAll(): void {
    for (const toast of this.visibleToasts) toast.timer?.pause();
  }

  /** Restarts the clocks of the toasts on screen, each with the time it had left. */
  resumeAll(): void {
    for (const toast of this.visibleToasts) toast.timer?.resume();
  }

  /** Subscribes to changes in the visible toasts. Returns the unsubscribe. */
  subscribe(fn: () => void): () => void {
    this.subscriptions.add(fn);

    return () => {
      this.subscriptions.delete(fn);
    };
  }

  private update(action: ToastAction): void {
    this.visibleToasts = [...this.queue];

    this.wrapUpdate(() => {
      for (const fn of [...this.subscriptions]) fn();
    }, action);
  }
}

/* -------------------------------------------------------------------------------------------------
 * View transitions
 * -----------------------------------------------------------------------------------------------*/
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
}

/**
 * A queue's own chain of view transitions, so its updates animate one after another.
 *
 * The View Transitions API allows one active transition per document: starting a second while the
 * first is still animating aborts the first, which surfaces as a rejection on `ready`. Each new
 * transition is appended to the *end* of the chain rather than attached to whichever is currently
 * active, so three mutations inside one microtask stay in order — which is what `toast.promise`
 * does while the loading toast's own entry is still in flight.
 *
 * **One chain per queue, not one per document.** Sharing a single chain across every queue looks
 * more faithful to an API that only runs one transition at a time, and it is wrong: with several
 * regions on a page, a burst of toasts in one of them puts every other region's toast behind the
 * whole burst, so a toast added elsewhere does not appear until seconds later. Independent chains
 * let a second region interrupt instead — the superseded transition is skipped, which the catch
 * below already handles, which is why the chain is scoped per queue inside the constructor.
 */
const createViewTransitionUpdate = (): {
  reset: () => void;
  wrapUpdate: (fn: () => void) => void;
} => {
  let chain: Promise<unknown> = Promise.resolve();

  return {
    reset: () => {
      chain = Promise.resolve();
    },
    wrapUpdate: (fn: () => void): void => {
      const startViewTransition =
        typeof document === "undefined"
          ? undefined
          : (
              document as Document & {
                startViewTransition?: (callback: () => Promise<void> | void) => ViewTransition;
              }
            ).startViewTransition;

      if (typeof startViewTransition !== "function") {
        fn();

        return;
      }

      const runNext = (): Promise<unknown> => {
        const transition = startViewTransition.call(document, () => {
          fn();

          // The DOM has to be updated before the transition takes its snapshot. The callback may
          // return a promise and the transition waits for it, so awaiting the scheduler's flush is
          // enough — no synchronous flush primitive is needed.
          return nextTick();
        });

        // A superseded or aborted transition rejects `ready` while `finished` still fulfills. Both
        // are caught so neither surfaces as an unhandled rejection, and so a step queued behind a
        // superseded transition still runs.
        transition.ready.catch(() => {});

        return transition.finished.catch(() => {});
      };

      chain = chain.then(runNext, runNext);
    },
  };
};

/* -------------------------------------------------------------------------------------------------
 * useToastQueue
 * -----------------------------------------------------------------------------------------------*/
export interface UseToastQueueReturn<T = ToastContentValue> {
  /** The toasts the queue currently holds, newest first. */
  visibleToasts: ComputedRef<QueuedToast<T>[]>;
}

/**
 * Follows a queue's visible toasts: an external-store subscription rather than reactive state.
 *
 * The subscription rather than reactive state inside the queue is what lets the singleton be a
 * plain object created at import time — module-level reactive state would tie it to an app.
 */
export const useToastQueue = <T = ToastContentValue>(
  queue: MaybeRefOrGetter<ToastQueue<T>>,
): UseToastQueueReturn<T> => {
  const visibleToasts = shallowRef<QueuedToast<T>[]>([]);

  let detach: (() => void) | undefined;

  watch(
    () => toValue(queue),
    (next) => {
      detach?.();
      visibleToasts.value = next.visibleToasts;
      detach = next.subscribe(() => {
        visibleToasts.value = next.visibleToasts;
      });
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    detach?.();
    detach = undefined;
  }, true);

  return { visibleToasts: computed(() => visibleToasts.value) };
};

/* -------------------------------------------------------------------------------------------------
 * Imperative API
 * -----------------------------------------------------------------------------------------------*/
export interface ToastFunction {
  (message: ToastRenderable, options?: ToastAddOptions): string;
  /** Removes every toast without running their `onClose`. */
  clear: () => void;
  /** Closes one toast by key. */
  close: (key: string) => void;
  /** The queue behind this function, for a region that wants to render it. */
  getQueue: () => ToastQueue<ToastContentValue>;
  /** Named `info`, but the variant it raises is `accent`. */
  info: (message: ToastRenderable, options?: Omit<ToastAddOptions, "variant">) => string;
  danger: (message: ToastRenderable, options?: Omit<ToastAddOptions, "variant">) => string;
  pauseAll: () => void;
  /** Shows a loading toast, then replaces it with a success or danger one. */
  promise: <T>(promise: (() => Promise<T>) | Promise<T>, options: ToastPromiseOptions<T>) => string;
  resumeAll: () => void;
  success: (message: ToastRenderable, options?: Omit<ToastAddOptions, "variant">) => string;
  warning: (message: ToastRenderable, options?: Omit<ToastAddOptions, "variant">) => string;
}

/**
 * A promise message, called with the resolved value when it is a factory.
 *
 * The cast is the whole reason this is a named helper: a functional component is also a plain
 * function, so no type can tell the two apart and the documented rule is that a function here is
 * a factory.
 */
const resolve = <T>(
  value: ToastRenderable | ((input: T) => ToastRenderable),
  input: T,
): ToastRenderable =>
  typeof value === "function" ? (value as (input: T) => ToastRenderable)(input) : value;

export const createToastFunction = (queue: ToastQueue<ToastContentValue>): ToastFunction => {
  const add = (message: ToastRenderable, options: ToastAddOptions = {}): string =>
    queue.add(
      {
        actionProps: options.actionProps,
        description: options.description,
        indicator: options.indicator,
        isLoading: options.isLoading,
        title: message,
        variant: options.variant ?? "default",
      },
      {
        onClose: options.onClose
          ? () => {
              // Deferred a frame, so the callback runs after the removal it is reporting has been
              // painted rather than in the middle of it.
              requestAnimationFrame(() => options.onClose?.());
            }
          : undefined,
        timeout: options.timeout,
      },
    );

  const withVariant =
    (variant: NonNullable<ToastContentValue["variant"]>) =>
    (message: ToastRenderable, options: Omit<ToastAddOptions, "variant"> = {}): string =>
      add(message, { ...options, variant });

  const toastFn = add as ToastFunction;

  toastFn.clear = () => queue.clear();
  toastFn.close = (key) => queue.close(key);
  toastFn.danger = withVariant("danger");
  toastFn.getQueue = () => queue;
  toastFn.info = withVariant("accent");
  toastFn.pauseAll = () => queue.pauseAll();
  toastFn.resumeAll = () => queue.resumeAll();
  toastFn.success = withVariant("success");
  toastFn.warning = withVariant("warning");

  toastFn.promise = <T>(
    promise: (() => Promise<T>) | Promise<T>,
    options: ToastPromiseOptions<T>,
  ): string => {
    const pending = typeof promise === "function" ? promise() : promise;

    // Never expires: it is the promise that decides when this one goes.
    const loadingKey = queue.add(
      { isLoading: true, title: options.loading, variant: "default" },
      { timeout: 0 },
    );

    void pending.then(
      (data) => {
        queue.close(loadingKey);
        toastFn.success(resolve(options.success, data));
      },
      (error: Error) => {
        queue.close(loadingKey);
        toastFn.danger(resolve(options.error, error));
      },
    );

    // Returned synchronously, so a caller can close the loading toast itself.
    return loadingKey;
  };

  return toastFn;
};

/* -------------------------------------------------------------------------------------------------
 * Default queue
 * -----------------------------------------------------------------------------------------------*/
/**
 * The queue every `<Toast.Provider>` reads unless handed another one.
 *
 * Module scope on purpose, and the reason the class holds no reactive state: `toast("Saved")` has
 * to work from anywhere, including code that is not inside a component at all.
 */
export const toastQueue = new ToastQueue<ToastContentValue>();

export const toast = createToastFunction(toastQueue);

/** How many toasts the default queue holds. For a test asserting it did not leak into the next. */
export const getQueuedToastCount = (): number => toastQueue.visibleToasts.length;

/** Empties the default queue and the transition chain. For a test, since both outlive a mount. */
export const resetToastQueue = (): void => {
  toastQueue.clear();
  toastQueue.resetTransitions();
};
