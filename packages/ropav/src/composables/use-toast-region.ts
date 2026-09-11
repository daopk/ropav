import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, shallowRef, toValue, watch } from "vue";

import { DEFAULT_HOTKEY } from "../components/toast/toast.constants";
import { toastStrings } from "../i18n/toast";
import { willOpenKeyboard } from "../utils/platform";
import { TOP_LAYER_ATTRIBUTE } from "../utils/top-layer";

import {
  getInteractionModality,
  retainInteractionModality,
  useInteractionStates,
} from "./use-interaction-states";
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
  /** Key combination that moves focus to the region. An empty list turns it off. */
  hotkey?: MaybeRefOrGetter<readonly string[] | undefined>;
  /** Forces the stack open regardless of pointer or focus. */
  isExpanded?: MaybeRefOrGetter<boolean | undefined>;
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
  /** Whether the stack should be opened out, so every toast shows at its own height. */
  isExpanded: ComputedRef<boolean>;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
  onPointerleave: () => void;
  /** Reasserts hover when the stack moves under a cursor that has not itself moved. */
  onPointermove: (event: PointerEvent) => void;
  regionAttrs: ComputedRef<ToastRegionAttrs>;
}

const TOAST_SELECTOR = '[role="alertdialog"]';

/** The package's spelling of react-aria's `focusWithoutScrolling`. */
const focusQuietly = (element: HTMLElement) => {
  element.focus({ preventScroll: true });
};

/** The `KeyboardEvent` booleans a hotkey entry can name. Anything else is an `event.code`. */
const MODIFIERS = ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const;

const matchesHotkey = (event: KeyboardEvent, hotkey: readonly string[]) => {
  // Every modifier has to agree, including the ones the combination does not name — otherwise
  // Alt+T would also answer Ctrl+Alt+T, which belongs to whatever the user bound it to.
  const modifiersAgree = MODIFIERS.every((name) => event[name] === hotkey.includes(name));
  const keysAgree = hotkey.every(
    (key) => MODIFIERS.includes(key as (typeof MODIFIERS)[number]) || event.code === key,
  );

  return modifiersAgree && keysAgree;
};

/**
 * The behaviour and accessibility wiring of the toast region, ported from react-aria's
 * `useToastRegion`.
 *
 * Four jobs, and they are only in one composable because they share the same state:
 *
 * 1. **Naming.** A landmark region labelled with how many notifications it holds.
 * 2. **Pausing.** Hover *or* focus anywhere inside stops every visible toast's clock, so a toast
 *    cannot expire while it is being read or operated. Losing both restarts them.
 * 3. **Focus recovery.** A toast that had focus and is then removed hands focus to a neighbour
 *    rather than dropping it on `<body>` — except under a pointer, where focus is pushed back out
 *    of the region, because a pointer user who is no longer hovering would otherwise hold every
 *    remaining clock paused by the focus they did not ask for.
 * 4. **Reaching it.** A key combination that moves focus to the region from anywhere, because a
 *    toast is announced where the user is not and tabbing to it means tabbing past everything
 *    between. The listener is on the document rather than the region: the region is only in the
 *    DOM while it holds a toast, so a listener of its own could never be the thing that reaches
 *    it first.
 *
 * One narrowing, recorded rather than hidden: react-aria also registers the region with a
 * document-level landmark manager, which is what makes F6 cycle between landmarks. Nothing else
 * in react-aria registers one, so with a single registrant F6 has nowhere to go — the rendered
 * DOM is identical either way, and toasts are still reachable by Tab. That is an argument about
 * cycling between landmarks and not about reaching this one, which is why job 4 stands beside it.
 *
 * One simplification: react-aria runs focus-within and raw focus as two channels, because its
 * focus-within fires once on entry and it needs every change. `focusin` and `focusout` bubble and
 * fire on every change already, so one pair answers both questions.
 */
export const useToastRegion = (options: UseToastRegionOptions): UseToastRegionReturn => {
  const strings = useLocalizedStringFormatter(toastStrings);

  const hover = useInteractionStates();

  // The modality decides whether focus opens the stack, and it is only answered correctly while
  // the shared listeners are attached — otherwise it reports however the page was last driven
  // before the component that cared about it unmounted.
  onScopeDispose(retainInteractionModality(), true);

  let isFocusWithin = false;

  /** Set by Escape, and cleared by the next thing that would open the stack on purpose. */
  const isDismissed = shallowRef(false);

  /**
   * Whether the focus inside the region should hold the stack open.
   *
   * Focus arriving by keyboard is someone working through the toasts and wants them all legible.
   * Focus arriving from a pointer is a side effect of the press, and on a touchscreen it is the
   * *only* signal there is — a tap would open the stack with nothing left to close it again,
   * since a finger has no hover to lose.
   */
  const isFocusExpanding = shallowRef(false);

  const isExpanded = computed(() => {
    // One toast has nothing to open out of. The ones already leaving are not in this list, so a
    // stack is never held open around toasts that are on their way out.
    if (toValue(options.visibleToasts).length <= 1) return false;

    if (toValue(options.isExpanded) === true) return true;

    return !isDismissed.value && (hover.isHovered.value || isFocusExpanding.value);
  });

  const updateTimers = () => {
    if (hover.isHovered.value || isFocusWithin) options.onPauseAll();
    else options.onResumeAll();
  };

  /**
   * Re-applied whenever the set of clocks changes, and not only when hover or focus moves.
   *
   * A toast added or updated while the pointer is on the stack mints a timer that the last
   * `onPauseAll` could not have reached, and the toast starts that timer itself — so without this
   * one toast counts down under a pointer that is holding every other toast frozen.
   */
  watch(() => toValue(options.visibleToasts), updateTimers, { flush: "post" });

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
    isDismissed.value = false;
    updateTimers();
  };

  const onPointerleave = () => {
    hover.onPointerleave();
    isDismissed.value = false;
    updateTimers();
  };

  /**
   * A pointer that has not moved still needs the stack to notice it.
   *
   * The stack shifts underneath a resting cursor whenever a toast arrives or leaves, and no
   * browser re-fires a boundary event for a pointer that stayed where it was — so without this
   * an opened stack folds the moment the thing being hovered is replaced beneath it.
   */
  const onPointermove = (event: PointerEvent) => {
    if (hover.isHovered.value) return;

    hover.onPointerenter(event);
    updateTimers();
  };

  /**
   * Escape folds the stack.
   *
   * Focus is released as well as the flag being set, because the expansion answers focus too: a
   * region that kept focus would reopen on the next thing that asked it.
   *
   * Hover is deliberately left where it is. The flag folds the stack on its own, and clearing
   * hover as well would restart every clock under a pointer that has not moved — so the toasts
   * being read would expire moments after being tidied out of the way.
   */
  const dismiss = () => {
    const element = toValue(options.elementRef);
    const active = typeof document === "undefined" ? null : document.activeElement;

    if (element && active instanceof HTMLElement && element.contains(active)) active.blur();

    isDismissed.value = true;
    isFocusExpanding.value = false;
    updateTimers();
  };

  /**
   * No browser fires `pointerleave` when the element under the pointer is removed, and a toast
   * closing under the cursor is the ordinary case here rather than a corner one. The next event
   * that says anything is a `pointerover` on something else, which is what this listens for.
   */
  const onDocumentPointerover = (event: PointerEvent) => {
    const element = toValue(options.elementRef);

    if (event.pointerType === "touch") return;
    if (!element || (event.target instanceof Node && element.contains(event.target))) return;
    if (!hover.isHovered.value) return;

    hover.onPointerleave();
    updateTimers();
  };

  const onDocumentKeydown = (event: KeyboardEvent) => {
    // Heard here rather than on the region, which only receives a key while it already holds
    // focus — and the stack is usually open because a pointer is on it, with focus left behind on
    // the page. A stack that could not be folded from where the user is typing is not foldable.
    if (event.key === "Escape") {
      dismiss();

      return;
    }

    const hotkey = toValue(options.hotkey) ?? DEFAULT_HOTKEY;
    const element = toValue(options.elementRef);

    if (hotkey.length === 0 || !element || !matchesHotkey(event, hotkey)) return;

    // A chord that produces a character belongs to the field it is typed into — Alt with a letter
    // is one on macOS — so the shortcut stands down rather than swallowing it and taking the
    // focus out of the field as well.
    if (event.target instanceof Element && willOpenKeyboard(event.target)) return;

    // One region answers, and it is the first to have claimed the combination. Several regions is
    // the ordinary arrangement for a page showing toasts in more than one corner, and every one
    // of them hears this — without the guard they would each preventDefault and each pull focus,
    // leaving it wherever the last listener happened to be attached.
    if (event.defaultPrevented) return;

    // Claimed rather than let through, because Alt with a letter opens the menu bar on Windows
    // and Linux and the region would take focus behind it.
    event.preventDefault();
    focusQuietly(element);

    // Set after the focus it follows, because `focusin` decides this from the shared modality and
    // a modifier chord deliberately does not move that — reaching the stack by shortcut would
    // otherwise focus it without opening it.
    isDismissed.value = false;
    isFocusExpanding.value = true;
  };

  watch(
    () => toValue(options.elementRef) ?? null,
    (element, _previous, onCleanup) => {
      if (!element || typeof document === "undefined") return;

      // Capture, so both are heard even where something inside stops the event travelling.
      document.addEventListener("keydown", onDocumentKeydown, true);
      document.addEventListener("pointerover", onDocumentPointerover, true);
      onCleanup(() => {
        document.removeEventListener("keydown", onDocumentKeydown, true);
        document.removeEventListener("pointerover", onDocumentPointerover, true);
      });
    },
    { flush: "post", immediate: true },
  );

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
    // Focus arriving is a deliberate reach for the stack, so it undoes an Escape that folded it.
    isDismissed.value = false;
    isFocusExpanding.value = getInteractionModality() === "keyboard";

    if (!isFocusWithin) {
      isFocusWithin = true;
      lastFocused = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      updateTimers();
    }

    const { target } = event;
    const toast = target instanceof Element ? target.closest<HTMLElement>(TOAST_SELECTOR) : null;
    const element = toValue(options.elementRef);

    // Read off the document now rather than from the list the last change left behind. react-aria
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
    isFocusExpanding.value = false;
    lastFocused = null;
    focusedIndex = -1;
    updateTimers();
  };

  return {
    isExpanded,
    onFocusin,
    onFocusout,
    onPointerenter,
    onPointerleave,
    onPointermove,
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
