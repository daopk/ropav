import type { PageSize } from "./use-page-size";
import type { ViewportSize } from "./use-viewport-size";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue, watch } from "vue";

import { ariaHideOutside } from "../utils/aria-hide-outside";

import { useDismissable } from "./use-dismissable";
import { useFocusScope } from "./use-focus-scope";
import { usePageSize } from "./use-page-size";
import { usePortal } from "./use-portal";
import { usePreventScroll } from "./use-prevent-scroll";
import { useViewportSize } from "./use-viewport-size";

export interface UseModalOverlayOptions {
  /**
   * The modal itself: the boundary an outside interaction is measured against, and the one subtree
   * left visible to assistive technology.
   *
   * Not the backdrop. React Aria passes the container for the same reason — a press on the backdrop
   * beside the dialog is *outside* the modal and has to dismiss it.
   */
  modalRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  isOpen: MaybeRefOrGetter<boolean>;
  onClose: () => void;
  /** Whether an interaction outside the modal dismisses it. @default false */
  isDismissable?: MaybeRefOrGetter<boolean | undefined>;
  /** @default false */
  isKeyboardDismissDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Filters which outside elements dismiss the modal. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
}

export interface UseModalOverlayReturn {
  /**
   * Bind to the **container**, not the backdrop.
   *
   * React Aria puts Escape on the same element, and it has to be one focus can reach from inside
   * the dialog — a key pressed in the dialog bubbles through the container and nowhere near the
   * backdrop, which is a sibling of nothing on that path.
   */
  onKeydown: (event: KeyboardEvent) => void;
  /** Publish on the backdrop as inline custom properties the stylesheet reads. */
  viewportStyle: ComputedRef<Record<string, string>>;
  viewport: ComputedRef<ViewportSize>;
  page: ComputedRef<PageSize>;
}

/**
 * Everything a modal overlay does besides render, ported from React Aria's `useModalOverlay` and
 * the `Overlay` layer around it.
 *
 * Four things happen while a modal is open, and **the order they are set up in is the contract**,
 * not an implementation detail. Cleanups run in the order their watchers were created, so:
 *
 * 1. dismissal — Escape and outside presses;
 * 2. hiding the rest of the page from assistive technology, with `inert`;
 * 3. containing focus, and giving it back on close;
 * 4. holding the page still.
 *
 * Two and three cannot be swapped. Focus is restored to the trigger when the scope tears down, and
 * a trigger inside an `inert` subtree cannot take focus — so the page has to be made live again
 * first. Getting this wrong leaves a keyboard user at the top of the document with no indication
 * anything happened, and nothing in jsdom notices.
 *
 * @example
 * ```ts
 * const overlay = useModalOverlay({
 *   isDismissable: () => props.isDismissable,
 *   isOpen: () => state.isOpen.value,
 *   modalRef: containerElement,
 *   onClose: state.close,
 * });
 * ```
 */
export const useModalOverlay = (options: UseModalOverlayOptions): UseModalOverlayReturn => {
  const isOpen = () => toValue(options.isOpen);
  const portal = usePortal();

  const dismissable = useDismissable({
    isDismissable: options.isDismissable,
    isKeyboardDismissDisabled: options.isKeyboardDismissDisabled,
    isOpen,
    onClose: options.onClose,
    overlayRef: options.modalRef,
    // A press in another app's window is not a press on this modal's backdrop.
    region: () => portal.root.value,
    shouldCloseOnInteractOutside: options.shouldCloseOnInteractOutside,
  });

  // Everything outside the modal is hidden from assistive technology and made inert, so a screen
  // reader cannot wander out of a dialog that visually blocks the page. Under a `PortalProvider`
  // with a root, "the page" is that root: a modal of one region leaves the rest live.
  watch(
    [isOpen, () => toValue(options.modalRef), () => portal.root.value],
    ([open, modal, root], _previous, onCleanup) => {
      if (!open || !modal) return;

      onCleanup(ariaHideOutside([modal], { root: root ?? undefined, shouldUseInert: true }));
    },
    { flush: "post", immediate: true },
  );

  // Created after the hiding above on purpose: see the note on the composable.
  useFocusScope({
    contain: true,
    isActive: isOpen,
    // Focus that leaves for another app's window is let go rather than pulled back.
    region: () => portal.root.value,
    restoreFocus: true,
    scopeRef: options.modalRef,
  });

  usePreventScroll({ isDisabled: () => !isOpen() });

  const viewport = useViewportSize();
  const page = usePageSize();

  return {
    onKeydown: dismissable.onKeydown,
    page: computed(() => page.value),
    viewport: computed(() => viewport.value),
    viewportStyle: computed(() => {
      // Rendered into an element of its own, the modal sizes to that element (the stylesheet's
      // `100%` fallback), not to the window's visual viewport.
      if (portal.isContained.value) return {};

      const style: Record<string, string> = {
        "--visual-viewport-height": `${viewport.value.height}px`,
        "--visual-viewport-width": `${viewport.value.width}px`,
      };

      // Absent rather than zero when there is nothing to measure, so the stylesheet's own fallback
      // applies instead of a height of nothing.
      if (page.value.width !== undefined) style["--page-width"] = `${page.value.width}px`;
      if (page.value.height !== undefined) style["--page-height"] = `${page.value.height}px`;

      return style;
    }),
  };
};
