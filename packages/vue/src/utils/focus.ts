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
 * The controls inside `element` that Tab actually visits.
 *
 * Narrower than {@link focusableIn}, and the difference matters: the selector cannot express
 * "not `tabindex="-1"`" for an element that is focusable by its tag alone, so a
 * `<button tabindex="-1">` matches `button:not([disabled])` and counts as focusable. That is
 * right for anything moving focus itself — a collection with a roving tab index holds every item
 * at `-1` and still has to page through them — and wrong for anything modelling the tab order,
 * where such a button is deliberately not a stop.
 */
export const tabbableIn = (element: HTMLElement): HTMLElement[] =>
  focusableIn(element).filter((child) => child.tabIndex >= 0);

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

/**
 * The nearest ancestor that scrolls its own content, or `null` when nothing up to the root does.
 *
 * Ported from React Aria's `getScrollParent`. Anything that watches for the edge of a list coming
 * into view has to observe against that box rather than the viewport, or a list inside a scrolling
 * panel would never report anything.
 */
export const getScrollParent = (element: HTMLElement | null): HTMLElement | null => {
  let current = element;

  while (current) {
    if (isScrollable(current)) return current;
    current = current.parentElement;
  }

  return null;
};

export interface FocusManagerOptions {
  /** Where to move from, when it should not be whatever holds focus right now. */
  from?: Element | null;
  /** Whether running off one end continues at the other. */
  wrap?: boolean;
}

export interface FocusManager {
  /** Move focus to the first stop inside the root, and return it. */
  focusFirst: () => HTMLElement | null;
  focusLast: () => HTMLElement | null;
  focusNext: (options?: FocusManagerOptions) => HTMLElement | null;
  focusPrevious: (options?: FocusManagerOptions) => HTMLElement | null;
}

/**
 * Move focus around inside an element from the outside.
 *
 * Ported from React Aria's `createFocusManager`. A date field needs this because typing into one
 * segment moves focus to the next: the segment knows it is finished, but only its field knows what
 * comes after it.
 *
 * Takes a getter rather than an element so it can be built before the element exists, which is the
 * order a component sets things up in.
 *
 * React walks the tree with a `TreeWalker` and stops on anything focusable; this reads the list
 * {@link focusableIn} already builds. The two agree wherever nothing is held at `tabindex="-1"`,
 * which no field of segments does.
 */
export const createFocusManager = (getRoot: () => HTMLElement | null | undefined): FocusManager => {
  const stops = (): HTMLElement[] => {
    const root = getRoot();

    return root ? focusableIn(root) : [];
  };

  const move = (step: 1 | -1, options: FocusManagerOptions = {}): HTMLElement | null => {
    const list = stops();

    if (list.length === 0) return null;

    const from = options.from ?? getRoot()?.ownerDocument.activeElement ?? null;
    const index = from instanceof HTMLElement ? list.indexOf(from) : -1;
    // Focus sitting outside the root counts as being just before the first stop, or just after
    // the last one, so the first move lands on an end rather than doing nothing.
    const target =
      index === -1
        ? list[step === 1 ? 0 : list.length - 1]
        : (list[index + step] ??
          (options.wrap ? list[step === 1 ? 0 : list.length - 1] : undefined));

    target?.focus();

    return target ?? null;
  };

  return {
    focusFirst: () => {
      const [first] = stops();

      first?.focus();

      return first ?? null;
    },
    focusLast: () => {
      const list = stops();
      const last = list[list.length - 1];

      last?.focus();

      return last ?? null;
    },
    focusNext: (options) => move(1, options),
    focusPrevious: (options) => move(-1, options),
  };
};
