import type { ShallowRef } from "vue";

import { onScopeDispose, shallowRef } from "vue";

import { isScrollable } from "../utils/focus";

export interface PageSize {
  /** Absent on the server, and while there is no document to measure. */
  width: number | undefined;
  height: number | undefined;
}

const getVisualViewport = () =>
  typeof document === "undefined" ? null : (window.visualViewport ?? null);

const measurePage = (): PageSize => {
  if (typeof document === "undefined") return { height: undefined, width: undefined };

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
