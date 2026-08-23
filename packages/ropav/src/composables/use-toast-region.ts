import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, toValue, watch } from "vue";

import { toastStrings } from "../i18n/toast";
import { TOP_LAYER_ATTRIBUTE } from "../utils/top-layer";

import { getInteractionModality, useInteractionStates } from "./use-interaction-states";
import { useLocalizedStringFormatter } from "./use-localized-string-formatter";

/** The only thing the region needs to know about a queued toast. */
interface ToastIdentity {
  key: string;
}

export interface UseToastRegionOptions {
  /** Overrides the generated notification-count label. */
  ariaLabel?: MaybeRefOrGetter<string | undefined>;
  /** The region element, which is also what the toasts are looked up inside. */
  elementRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Stops every visible toast's clock. */
  onPauseAll: () => void;
  /** Restarts every visible toast's clock. */
  onResumeAll: () => void;
  visibleToasts: MaybeRefOrGetter<ToastIdentity[]>;
}

export interface ToastRegionAttrs {
  "aria-label": string;
  [TOP_LAYER_ATTRIBUTE]: true;
  role: "region";
  tabindex: -1;
}

export interface UseToastRegionReturn {
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: () => void;
  regionAttrs: ComputedRef<ToastRegionAttrs>;
}

const TOAST_SELECTOR = '[role="alertdialog"]';

/** The package's spelling of react-aria's `focusWithoutScrolling`. */
const focusQuietly = (element: HTMLElement) => {
  element.focus({ preventScroll: true });
};

/**
 * The behaviour and accessibility wiring of the toast region, ported from react-aria's
 * `useToastRegion`.
 *
 * Three jobs, and they are only in one composable because they share the same state:
 *
 * 1. **Naming.** A landmark region labelled with how many notifications it holds.
 * 2. **Pausing.** Hover *or* focus anywhere inside stops every visible toast's clock, so a toast
 *    cannot expire while it is being read or operated. Losing both restarts them.
 * 3. **Focus recovery.** A toast that had focus and is then removed hands focus to a neighbour
 *    rather than dropping it on `<body>` — except under a pointer, where focus is pushed back out
 *    of the region, because a pointer user who is no longer hovering would otherwise hold every
 *    remaining clock paused by the focus they did not ask for.
 *
 * One narrowing, recorded rather than hidden: upstream also registers the region with a
 * document-level landmark manager, which is what makes F6 cycle between landmarks. Nothing else
 * in react-aria registers one, so with a single registrant F6 has nowhere to go — the rendered
 * DOM is identical either way, and toasts are still reachable by Tab.
 *
 * One simplification: upstream runs focus-within and raw focus as two channels, because its
 * focus-within fires once on entry and it needs every change. `focusin` and `focusout` bubble and
 * fire on every change already, so one pair answers both questions.
 */
export const useToastRegion = (options: UseToastRegionOptions): UseToastRegionReturn => {
  const strings = useLocalizedStringFormatter(toastStrings);

  const hover = useInteractionStates();

  let isFocusWithin = false;

  const updateTimers = () => {
    if (hover.isHovered.value || isFocusWithin) options.onPauseAll();
    else options.onResumeAll();
  };

  /**
   * Hover has to settle the clocks *in the handler*, not in a watcher on the state it sets.
   *
   * A watcher runs a tick later, and a tick is long enough for a toast to expire under the
   * pointer that was supposed to be holding it — which is the entire job. The state is still
   * reported through `useInteractionStates` so touch is filtered out the same way the stylesheet
   * filters it.
   */
  const onPointerenter = (event: PointerEvent) => {
    hover.onPointerenter(event);
    updateTimers();
  };

  const onPointerleave = () => {
    hover.onPointerleave();
    updateTimers();
  };

  /** The alertdialog elements, as of the last change to the visible toasts. */
  let toastElements: HTMLElement[] = [];
  let previousToasts: ToastIdentity[] = toValue(options.visibleToasts);

  /** Index of the toast holding focus, in visible-toast order; `-1` for none. */
  let focusedIndex = -1;

  /** Where focus came from before it entered the region. */
  let lastFocused: HTMLElement | null = null;

  const restoreLastFocused = () => {
    if (!lastFocused?.isConnected) return;

    if (getInteractionModality() === "pointer") focusQuietly(lastFocused);
    else lastFocused.focus();

    lastFocused = null;
  };

  /**
   * Which neighbour inherits focus from a removed toast, ported arithmetic and all.
   *
   * The rule it encodes: prefer the nearest surviving toast on the *newer* side, fall back to the
   * older side. Read against the list as it was before the change, then applied to the list as it
   * is now — which is why the indices look off by one.
   *
   * Only reachable for a toast that is not frontmost, and only the frontmost toast is focusable
   * (the rest are `tabindex="-1"` and `pointer-events: none`), so in practice this always resolves
   * to the toast that moved into the front. Ported whole regardless, so no path here can drift.
   */
  const recoverFocus = (removedIndex: number, previous: { isRemoved: boolean }[]) => {
    let i = 0;
    let prevToast: number | undefined;
    let nextToast: number | undefined;

    while (i <= removedIndex) {
      if (!previous[i]!.isRemoved) prevToast = Math.max(0, i - 1);
      i++;
    }

    while (i < previous.length) {
      if (!previous[i]!.isRemoved) {
        nextToast = i - 1;
        break;
      }

      i++;
    }

    // One toast at a time leaves both unset, and the index can only have been 0.
    if (prevToast === undefined && nextToast === undefined) prevToast = 0;

    const target =
      prevToast !== undefined && prevToast < toastElements.length
        ? toastElements[prevToast]
        : nextToast !== undefined && nextToast >= 0 && nextToast < toastElements.length
          ? toastElements[nextToast]
          : undefined;

    if (target) focusQuietly(target);
  };

  watch(
    () => toValue(options.visibleToasts),
    (visibleToasts) => {
      const element = toValue(options.elementRef);

      if (focusedIndex === -1 || visibleToasts.length === 0 || !element) {
        toastElements = [];
        previousToasts = visibleToasts;

        return;
      }

      toastElements = [...element.querySelectorAll<HTMLElement>(TOAST_SELECTOR)];

      const unchanged =
        previousToasts.length === visibleToasts.length &&
        visibleToasts.every((toast, index) => toast.key === previousToasts[index]?.key);

      if (unchanged) {
        previousToasts = visibleToasts;

        return;
      }

      const previous = previousToasts.map((toast) => ({
        isRemoved: !visibleToasts.some((next) => next.key === toast.key),
      }));

      const removedIndex = previous[focusedIndex]?.isRemoved === true ? focusedIndex : -1;

      if (removedIndex > -1) {
        // Under a pointer, focus leaves the region entirely: a pointer user who has moved away
        // would otherwise keep every remaining clock paused, and the toasts would look stuck.
        if (getInteractionModality() === "pointer" && lastFocused?.isConnected) {
          focusQuietly(lastFocused);
        } else {
          recoverFocus(removedIndex, previous);
        }
      }

      previousToasts = visibleToasts;
    },
    { flush: "post" },
  );

  // The region stops existing once it is empty, and a focus scope only restores focus once, so the
  // handoff back out has to be made here.
  watch(
    () => toValue(options.visibleToasts).length,
    (count) => {
      if (count === 0) restoreLastFocused();
    },
    { flush: "post" },
  );

  onScopeDispose(restoreLastFocused, true);

  const onFocusin = (event: FocusEvent) => {
    if (!isFocusWithin) {
      isFocusWithin = true;
      lastFocused = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      updateTimers();
    }

    const { target } = event;
    const toast = target instanceof Element ? target.closest<HTMLElement>(TOAST_SELECTOR) : null;
    const element = toValue(options.elementRef);

    // Read off the document now rather than from the list the last change left behind. Upstream
    // reuses that list, which is only ever refreshed by an effect that bails whenever nothing has
    // focus — so the very first focus into the region resolves against an empty list and the
    // recovery below can never run.
    focusedIndex =
      toast && element
        ? [...element.querySelectorAll<HTMLElement>(TOAST_SELECTOR)].indexOf(toast)
        : -1;
  };

  const onFocusout = (event: FocusEvent) => {
    const { currentTarget, relatedTarget, target } = event;

    // A toast being removed must not read as the user leaving. Chromium does not report a
    // `focusout` at all when the focused element is taken out of the document, which is what the
    // recovery above relies on; this keeps the recovery reachable wherever one *is* reported.
    if (target instanceof Node && !target.isConnected) return;

    // Focus moving between toasts never left the region, even though a `focusout` says so.
    if (
      currentTarget instanceof Node &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    isFocusWithin = false;
    lastFocused = null;
    focusedIndex = -1;
    updateTimers();
  };

  return {
    onFocusin,
    onFocusout,
    onPointerenter,
    onPointerleave,
    regionAttrs: computed(() => ({
      // Marks the region as a top layer, so it is not hidden from assistive technology when an
      // overlay opens and a press on it does not dismiss that overlay.
      [TOP_LAYER_ATTRIBUTE]: true as const,

      "aria-label":
        toValue(options.ariaLabel) ||
        strings.value.format("notifications", { count: toValue(options.visibleToasts).length }),
      role: "region" as const,
      tabindex: -1 as const,
    })),
  };
};
