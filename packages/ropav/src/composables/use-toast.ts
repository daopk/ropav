import type { Timer } from "../components/toast/toast-queue";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onMounted, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { useId } from "./use-id";

export interface UseToastOptions {
  /** Called when the toast should close, whether from its own clock or the close button. */
  onClose: () => void;
  /** The toast's clock, if it has one. */
  timer: MaybeRefOrGetter<Timer | undefined>;
  /** Milliseconds the clock should run for. */
  timeout: MaybeRefOrGetter<number | undefined>;
}

export interface ToastAttrs {
  "aria-describedby": string | undefined;
  "aria-labelledby": string;
  "aria-modal": "false";
  role: "alertdialog";
}

export interface ToastContentAttrs {
  "aria-atomic": "true";
  "aria-hidden": "true" | undefined;
  role: "alert";
}

export interface UseToastReturn {
  /** Closes this toast. */
  close: () => void;
  contentAttrs: ComputedRef<ToastContentAttrs>;
  descriptionAttrs: ComputedRef<{ id: string }>;
  /** Called by a rendered description so the toast knows to point at it. Returns the release. */
  registerDescription: () => () => void;
  titleAttrs: ComputedRef<{ id: string }>;
  toastAttrs: ComputedRef<ToastAttrs>;
}

/**
 * The behaviour and accessibility wiring of one toast, ported from react-aria's `useToast`.
 *
 * `role="alertdialog"` with `aria-modal="false"` rather than `alert`: a toast holds controls, so
 * it has to be a dialog for a screen reader to let the user into it, and a non-modal one because
 * the rest of the page stays live. The content inside carries the `role="alert"` that does the
 * announcing.
 *
 * The clock starts **here**, on mount, and not when the toast was queued: a toast added while the
 * region is not rendered has not already spent its life waiting to appear. Unmounting pauses it
 * rather than dropping it, so a toast that comes back has the time it had left.
 *
 * One narrowing against upstream: it also returns a localized `aria-label` for the close button,
 * which nothing can use — `CloseButton` writes its own `aria-label="Close"`, and that hardcoded
 * label wins over the one offered through context.
 */
export const useToast = (options: UseToastOptions): UseToastReturn => {
  const titleId = useId();
  const descriptionId = useId();

  let descriptionClaims = 0;
  const hasDescription = shallowRef(false);

  /**
   * Upstream resolves this with `useSlotId`, which hands out the id and then withdraws it in a
   * layout effect when no element turns out to carry it. The claim is the same answer asked
   * directly rather than probed off the document, and it is how the rest of this package settles
   * whether an id has an owner.
   */
  const registerDescription = () => {
    descriptionClaims += 1;
    hasDescription.value = true;

    return () => {
      descriptionClaims -= 1;
      hasDescription.value = descriptionClaims > 0;
    };
  };

  /**
   * Withheld for the first tick, then dropped.
   *
   * NVDA does not announce the toast at all without this — the alert has to become visible to the
   * accessibility tree *after* it exists for the announcement to fire. Upstream carries the same
   * flag and the same reason.
   */
  const isVisible = shallowRef(false);

  onMounted(() => {
    isVisible.value = true;
  });

  const pause = () => {
    toValue(options.timer)?.pause();
  };

  onMounted(() => {
    watch(
      () => ({ timeout: toValue(options.timeout), timer: toValue(options.timer) }),
      (next, previous) => {
        previous?.timer?.pause();

        if (next.timer == null || next.timeout == null) return;

        next.timer.reset(next.timeout);
      },
      { immediate: true },
    );
  });

  onScopeDispose(pause, true);

  return {
    close: () => options.onClose(),
    contentAttrs: computed(() => ({
      "aria-atomic": "true" as const,
      "aria-hidden": isVisible.value ? undefined : ("true" as const),
      role: "alert" as const,
    })),
    descriptionAttrs: computed(() => ({ id: descriptionId.value })),
    registerDescription,
    titleAttrs: computed(() => ({ id: titleId.value })),
    toastAttrs: computed(() => ({
      // Left pointing at the id whether or not a title is rendered, matching
      // `react-aria-components`: it does not withdraw the reference for a toast without one.
      "aria-describedby": hasDescription.value ? descriptionId.value : undefined,
      "aria-labelledby": titleId.value,
      "aria-modal": "false" as const,
      role: "alertdialog" as const,
    })),
  };
};
