/**
 * Controls that can hold focus, in the order the browser would visit them.
 *
 * Deliberately not `[tabindex]` on its own: a `tabindex="-1"` element is focusable
 * programmatically but is not a tab stop, and counting it would make one arrow press appear
 * to land nowhere.
 */
export const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Whether an element is visible enough to take focus.
 *
 * `checkVisibility()` is the only reliable read of this — `offsetParent` is always `null` in
 * jsdom, and a `display: none` ancestor is invisible to a bounding-rect check. jsdom does not
 * implement `checkVisibility` either, so there everything counts, which is what tests
 * exercising key order want anyway.
 */
export const isElementVisible = (element: HTMLElement): boolean =>
  typeof element.checkVisibility === "function" ? element.checkVisibility() : true;

/** The focusable controls inside `element`, in document order, skipping hidden ones. */
export const focusableIn = (element: HTMLElement): HTMLElement[] =>
  [...element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isElementVisible);

/**
 * Whether an element scrolls its own content.
 *
 * Ported from React Aria's `isScrollable`. Paging keys need this: in a list that does not
 * scroll there is no page to move by, so Page Up and Page Down collapse to the ends instead.
 * The document's scrolling element is a special case — it scrolls despite defaulting to
 * `overflow: visible`.
 */
export const isScrollable = (element: Element | null): boolean => {
  if (!element) return false;

  const style = getComputedStyle(element);
  const root = document.scrollingElement ?? document.documentElement;

  if (element === root && style.overflow !== "hidden") return true;

  return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
};
