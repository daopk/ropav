import type {ShallowRef} from "vue";

import {onScopeDispose, shallowRef} from "vue";

import {isScrollable} from "../utils/focus";
import {isIOS, isWebKit, willOpenKeyboard} from "../utils/platform";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PageSize {
  /** Absent on the server, and while there is no document to measure. */
  width: number | undefined;
  height: number | undefined;
}

const getVisualViewport = () =>
  typeof document === "undefined" ? null : (window.visualViewport ?? null);

/**
 * The viewport as it actually is, which on a phone is not the window.
 *
 * Ported from React Aria's `useViewportSize`. A software keyboard does not resize the window; it
 * covers part of it, and only `visualViewport` reports what is left. A modal sized to the window
 * therefore puts its footer under the keyboard, which is the whole reason this exists.
 */
const measureViewport = (): ViewportSize => {
  if (typeof document === "undefined") return {height: 0, width: 0};

  const viewport = getVisualViewport();

  if (!viewport) {
    return {
      height: document.documentElement.clientHeight,
      width: document.documentElement.clientWidth,
    };
  }

  return {
    height: viewport.height * viewport.scale,
    // The visual viewport's width can include the scrollbar gutter, so the document element is
    // the ceiling. Multiplied by the scale to undo pinch zoom and get the natural size back.
    width: Math.min(viewport.width * viewport.scale, document.documentElement.clientWidth),
  };
};

/**
 * Track the visual viewport, ported from React Aria's `useViewportSize`.
 *
 * The stylesheet reads the result as `--visual-viewport-height`, so a modal is as tall as the
 * space actually left over rather than as tall as the window.
 *
 * @example
 * ```ts
 * const viewport = useViewportSize();
 * // style: `--visual-viewport-height: ${viewport.value.height}px`
 * ```
 */
export const useViewportSize = (): ShallowRef<ViewportSize> => {
  const size = shallowRef<ViewportSize>(measureViewport());

  if (typeof document === "undefined") return size;

  const update = (next: ViewportSize) => {
    if (next.width === size.value.width && next.height === size.value.height) return;

    size.value = next;
  };

  const onResize = () => {
    const viewport = getVisualViewport();

    // Pinch zoom shrinks the visual viewport without anything having moved, and a modal that
    // followed it would shrink away from the content the user zoomed in to read.
    if (viewport && viewport.scale > 1) return;

    update(measureViewport());
  };

  let frame: number | undefined;

  /**
   * WebKit on iOS does not report the resize until the keyboard has finished sliding away, so the
   * new size is anticipated from the blur instead — the layout size is already the final one.
   */
  const onBlur = (event: FocusEvent) => {
    const viewport = getVisualViewport();

    if (viewport && viewport.scale > 1) return;
    if (!(event.target instanceof Element) || !willOpenKeyboard(event.target)) return;

    // One frame, in case focus is only moving to another field and the keyboard stays.
    frame = requestAnimationFrame(() => {
      const active = document.activeElement;

      if (active && willOpenKeyboard(active)) return;

      update({
        height: document.documentElement.clientHeight,
        width: document.documentElement.clientWidth,
      });
    });
  };

  update(measureViewport());

  const viewport = getVisualViewport();
  const isIOSWebKit = isIOS() && isWebKit();

  if (isIOSWebKit) window.addEventListener("blur", onBlur, true);

  if (viewport) viewport.addEventListener("resize", onResize);
  else window.addEventListener("resize", onResize);

  onScopeDispose(() => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    if (isIOSWebKit) window.removeEventListener("blur", onBlur, true);

    if (viewport) viewport.removeEventListener("resize", onResize);
    else window.removeEventListener("resize", onResize);
  }, true);

  return size;
};

const measurePage = (): PageSize => {
  if (typeof document === "undefined") return {height: undefined, width: undefined};

  const scrolling = isScrollable(document.body)
    ? document.body
    : (document.scrollingElement ?? document.documentElement);
  const rect = scrolling.getBoundingClientRect();

  // The fractional remainder is dropped: a page whose width is not a whole number would otherwise
  // round up and make Firefox add a scrollbar for the fraction.
  return {
    height: scrolling.scrollHeight - (rect.height % 1),
    width: scrolling.scrollWidth - (rect.width % 1),
  };
};

/**
 * Track the size of the whole scrollable page.
 *
 * Ported from the block React Aria computes inline in `ModalOverlayInner`. Published as
 * `--page-width` / `--page-height` for a backdrop that has to cover a page taller than the
 * viewport rather than only the part currently on screen.
 */
export const usePageSize = (): ShallowRef<PageSize> => {
  const size = shallowRef<PageSize>(measurePage());

  if (typeof document === "undefined") return size;

  const onResize = () => {
    const next = measurePage();

    if (next.width === size.value.width && next.height === size.value.height) return;

    size.value = next;
  };

  const viewport = getVisualViewport();

  window.addEventListener("resize", onResize);
  viewport?.addEventListener("resize", onResize);

  onScopeDispose(() => {
    window.removeEventListener("resize", onResize);
    viewport?.removeEventListener("resize", onResize);
  }, true);

  return size;
};
