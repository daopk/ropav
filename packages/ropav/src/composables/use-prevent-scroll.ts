import type { MaybeRefOrGetter } from "vue";

import { toValue, watch } from "vue";

/** How many live callers want scrolling blocked; the page is restored when it reaches zero. */
let count = 0;
let restore: () => void = () => {};

/** Set a style property, returning the undo. */
const setStyle = <K extends keyof CSSStyleDeclaration & string>(
  element: HTMLElement,
  property: K,
  value: string,
) => {
  const previous = element.style[property];

  element.style[property] = value as CSSStyleDeclaration[K];

  return () => {
    element.style[property] = previous;
  };
};

const preventScroll = () => {
  const documentElement = document.documentElement;
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
  const undo: (() => void)[] = [];

  // Hiding the scrollbar makes the page a little wider, which shifts every centred thing on it
  // sideways. Reserving the gutter keeps the layout still.
  if (scrollbarWidth > 0) {
    undo.push(
      "scrollbarGutter" in documentElement.style
        ? setStyle(documentElement, "scrollbarGutter", "stable")
        : setStyle(documentElement, "paddingRight", `${scrollbarWidth}px`),
    );
  }

  undo.push(setStyle(documentElement, "overflow", "hidden"));

  return () => {
    for (const step of undo.reverse()) step();
  };
};

export interface UsePreventScrollOptions {
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * Block page scrolling while a modal overlay is open, ported from React Aria's
 * `usePreventScroll`.
 *
 * A modal overlay covers the page, and content nobody can reach should not move under the cover.
 * An overlay is positioned once, in document coordinates, so a page that scrolled would carry the
 * overlay along with its trigger — still aligned, but travelling out of view. Only a scroll inside
 * some region between the two actually breaks the alignment, and that one closes the overlay
 * rather than being blocked here.
 *
 * The count is module-level because the page has one scroll position: two overlays open at once
 * both want it held, and the second closing must not release it while the first is still open.
 *
 * React Aria carries a second implementation for Safari on iOS, built on holding the body in place
 * and replaying the scroll position afterwards. It is deliberately not ported. The behaviour it
 * works around belongs to an older WebKit — `overflow: hidden` on the root holds the page on
 * current iOS — and the technique would cost more here than it gives: it makes the body the
 * containing block, and every overlay is placed in document coordinates measured before the lock,
 * so each one would be displaced by the scroll offset on the way open.
 *
 * @example
 * ```ts
 * usePreventScroll({isDisabled: () => !state.isOpen.value});
 * ```
 */
export const usePreventScroll = (options: UsePreventScrollOptions = {}): void => {
  watch(
    () => Boolean(toValue(options.isDisabled)),
    (isDisabled, _previous, onCleanup) => {
      if (isDisabled || typeof document === "undefined") return;

      count++;

      if (count === 1) restore = preventScroll();

      onCleanup(() => {
        count--;

        if (count === 0) restore();
      });
    },
    { immediate: true },
  );
};
