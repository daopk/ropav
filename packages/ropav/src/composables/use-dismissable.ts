import type { MaybeRefOrGetter } from "vue";

import { computed, onScopeDispose, toValue, watch } from "vue";

import { isInTopLayer } from "../utils/top-layer";

import { isElementInAnyFocusScope } from "./use-focus-scope";

/**
 * Open overlays, innermost last.
 *
 * Module-level on purpose: a click outside must dismiss exactly one overlay — the innermost —
 * and no single overlay can know whether another is nested inside it. React Aria keeps the same
 * list for the same reason.
 */
const visibleOverlays: object[] = [];

export interface UseDismissableOptions {
  /** The overlay element. Interaction inside it never dismisses. */
  overlayRef: MaybeRefOrGetter<Element | null | undefined>;
  isOpen?: MaybeRefOrGetter<boolean | undefined>;
  onClose?: () => void;
  /** Whether interacting outside dismisses the overlay. @default false */
  isDismissable?: MaybeRefOrGetter<boolean | undefined>;
  /** @default false */
  isKeyboardDismissDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Whether focus leaving the overlay dismisses it.
   *
   * Not the same question as `isDismissable`, and the two do not overlap: a popover that leaves
   * the page live is not dismissed by a press outside — the press was meant for whatever it
   * landed on — but tabbing away from it is the user leaving, and it has nothing left to say.
   *
   * @default false
   */
  shouldCloseOnBlur?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Filters which outside elements dismiss the overlay. Return `false` for an element that
   * should be left alone — the trigger of an already-open submenu, for one.
   */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}

export interface UseDismissableReturn {
  /** Bind to the overlay so Escape dismisses it. */
  onKeydown: (event: KeyboardEvent) => void;
  /** Bind to the overlay so focus leaving it dismisses it, when `shouldCloseOnBlur` is set. */
  onFocusout: (event: FocusEvent) => void;
}

/**
 * Dismiss an overlay on Escape or on an interaction outside it, ported from React Aria's
 * `useOverlay` and `useInteractOutside`.
 *
 * Dismissal is decided over two events rather than one. A pointerdown outside marks the
 * interaction as started, and the *click* that follows is what dismisses: pressing down outside
 * and releasing inside is a drag, not a dismissal, and using pointerup instead trips over
 * Chrome on Android firing it in cases where no click follows.
 *
 * Escape and the outside click both stop at the innermost open overlay, so dismissing a submenu
 * leaves the menu it came from open.
 *
 * Focus leaving is a third way out, off by default and asked for separately — `shouldCloseOnBlur`.
 * It is the only way an overlay that leaves the page live gets closed by a pointer at all, since
 * such an overlay is not dismissable by an outside press.
 *
 * @example
 * ```ts
 * const {onKeydown} = useDismissable({
 *   isDismissable: true,
 *   isOpen: () => state.isOpen.value,
 *   onClose: state.close,
 *   overlayRef: popoverElement,
 * });
 * ```
 */
export const useDismissable = (options: UseDismissableOptions): UseDismissableReturn => {
  // Identity for this overlay in the shared stack. The element itself cannot be used: it does
  // not exist yet when the overlay registers, and it is replaced when the overlay reopens.
  const layer = {};

  const isOpen = computed(() => Boolean(toValue(options.isOpen)));
  const isDismissable = computed(() => Boolean(toValue(options.isDismissable)));

  const getOverlay = () => toValue(options.overlayRef) ?? null;

  const isTopMost = () => visibleOverlays.at(-1) === layer;

  const close = () => {
    if (isTopMost()) options.onClose?.();
  };

  watch(
    isOpen,
    (open, _previous, onCleanup) => {
      if (!open) return;

      visibleOverlays.push(layer);

      onCleanup(() => {
        const index = visibleOverlays.indexOf(layer);

        if (index >= 0) visibleOverlays.splice(index, 1);
      });
    },
    { immediate: true },
  );

  /** Whether the event happened outside the overlay and is worth acting on. */
  const isOutside = (event: PointerEvent | MouseEvent) => {
    if (event.button > 0) return false;

    const overlay = getOverlay();

    if (!overlay) return false;

    const target = event.target;

    // An element already detached from the document cannot be judged inside or outside, and it
    // is usually something the overlay's own interaction removed.
    if (!(target instanceof Element) || !target.ownerDocument.documentElement.contains(target)) {
      return false;
    }

    // A top layer is drawn over every overlay without belonging to any of them. Pressing a toast
    // that happened to appear over a popover is not a press outside that popover — dismissing it
    // is not what the user asked for. React Aria draws the same exemption in the same place.
    if (isInTopLayer(target)) return false;

    // `composedPath` rather than `contains`, so a target inside an open shadow root resolves
    // to the real element rather than to the shadow root.
    return !event.composedPath().includes(overlay);
  };

  /** Whether the pointerdown that began this interaction was outside. */
  let pointerDownWasOutside = false;
  /** Which overlay was innermost when the interaction began, so a dismissal that opened another overlay does not also dismiss this one. */
  let layerAtPointerDown: object | undefined;

  const listeners: (() => void)[] = [];

  const attach = () => {
    if (!isDismissable.value || !isOpen.value || typeof document === "undefined") return;

    const onPointerdown = (event: PointerEvent) => {
      if (!isOutside(event)) return;

      layerAtPointerDown = visibleOverlays.at(-1);

      if (
        options.shouldCloseOnInteractOutside &&
        !options.shouldCloseOnInteractOutside(event.target as Element)
      ) {
        return;
      }

      pointerDownWasOutside = true;

      // Keeps an enclosing overlay from also treating this as its own outside interaction.
      if (isTopMost()) event.stopPropagation();
    };

    const onClick = (event: MouseEvent) => {
      if (!pointerDownWasOutside) {
        layerAtPointerDown = undefined;

        return;
      }

      pointerDownWasOutside = false;

      if (!isOutside(event)) {
        layerAtPointerDown = undefined;

        return;
      }

      if (
        options.shouldCloseOnInteractOutside &&
        !options.shouldCloseOnInteractOutside(event.target as Element)
      ) {
        layerAtPointerDown = undefined;

        return;
      }

      if (isTopMost()) event.stopPropagation();

      // Only the overlay that was innermost when the press began may close: by now the press
      // may have opened another one on top.
      if (layerAtPointerDown === layer) close();

      layerAtPointerDown = undefined;
    };

    // Capture phase, so this runs before anything inside the page can stop the event.
    document.addEventListener("pointerdown", onPointerdown, true);
    document.addEventListener("click", onClick, true);

    listeners.push(() => {
      document.removeEventListener("pointerdown", onPointerdown, true);
      document.removeEventListener("click", onClick, true);
    });
  };

  const detach = () => {
    for (const remove of listeners.splice(0)) remove();
    pointerDownWasOutside = false;
  };

  watch(
    [isOpen, isDismissable],
    () => {
      detach();
      attach();
    },
    { immediate: true },
  );

  onScopeDispose(() => detach(), true);

  /**
   * Dismiss when focus leaves the overlay entirely.
   *
   * `focusout` is dispatched at the element losing focus and bubbles, so this only ever runs for
   * focus that was inside — which is the `onBlurWithin` of React Aria's `useFocusWithin`, the
   * shape `useOverlay` reads there.
   */
  const onFocusout = (event: FocusEvent) => {
    if (!toValue(options.shouldCloseOnBlur) || !isOpen.value) return;

    const next = event.relatedTarget;

    // Focus lost to nothing at all — the window went away, or the user switched tabs. React Aria
    // returns here for the same reason and names the same bug: a press that lands on the page is
    // the outside-interaction path's business, and it already ran.
    if (!(next instanceof Element)) return;

    // Still inside. `focusout` fires on every hop between children, so most of them land here.
    if (getOverlay()?.contains(next)) return;

    // A top layer is drawn over every overlay without belonging to any of them, exactly as in
    // `isOutside` above.
    if (isInTopLayer(next)) return;

    // An overlay opened from inside this one is a DOM sibling rather than a descendant, so the
    // question is answered by focus scope rather than by containment.
    if (isElementInAnyFocusScope(next)) return;

    if (options.shouldCloseOnInteractOutside && !options.shouldCloseOnInteractOutside(next)) return;

    // Deliberately not `close()`: React Aria calls `onClose` straight through here rather than
    // going by the innermost overlay, because focus has said where it went and the stack has not
    // been consulted about it.
    options.onClose?.();
  };

  return {
    onFocusout,
    onKeydown: (event) => {
      if (event.key !== "Escape") return;
      if (toValue(options.isKeyboardDismissDisabled)) return;
      if (!isTopMost()) return;

      event.preventDefault();
      event.stopPropagation();
      options.onClose?.();
    },
  };
};
