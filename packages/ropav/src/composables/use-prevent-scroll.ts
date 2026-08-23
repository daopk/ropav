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
 * An overlay is positioned once, against where its trigger was. Scrolling the page behind it
 * moves the trigger and leaves the overlay pointing at nothing, so a modal overlay stops the page
 * moving rather than trying to follow it.
 *
 * The count is module-level because the page has one scroll position: two overlays open at once
 * both want it held, and the second closing must not release it while the first is still open.
 *
 * React Aria carries a second implementation for Safari on iOS, which scrolls the page even with
 * `overflow: hidden`. That is not ported.
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
