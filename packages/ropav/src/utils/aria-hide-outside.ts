import { TOP_LAYER_SELECTOR } from "./top-layer";

const supportsInert = typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype;

/**
 * How many active calls are hiding each element.
 *
 * Two overlays can be open at once and both want the rest of the page hidden; the attribute may
 * only come off when the last of them is done. An element that was already hidden by the page
 * itself keeps a count of zero, so it is never un-hidden by this.
 */
const refCounts = new WeakMap<Element, number>();

interface Layer {
  visibleNodes: Set<Element>;
  hiddenNodes: Set<Element>;
  observe: () => void;
  disconnect: () => void;
}

/** Active layers, innermost last. Only the innermost watches the DOM for new content. */
const layers: Layer[] = [];

/** Content that must never be hidden, however deep in the page it sits. */
const ALWAYS_VISIBLE_SELECTOR = `[data-live-announcer], ${TOP_LAYER_SELECTOR}`;

const isAlwaysVisible = (node: Element) =>
  node instanceof HTMLElement && node.matches(ALWAYS_VISIBLE_SELECTOR);

export interface AriaHideOutsideOptions {
  /** Nothing above this element is hidden. @default document.body */
  root?: Element;
  /**
   * Uses `inert` instead of `aria-hidden`, which also blocks pointer interaction and focus
   * rather than only hiding content from assistive technology.
   */
  shouldUseInert?: boolean;
}

/**
 * Hide everything outside the given elements from assistive technology, and keep hiding anything
 * that appears later, ported from React Aria's `ariaHideOutside`.
 *
 * A modal overlay looks exclusive but is not: everything behind it is still in the accessibility
 * tree, so a screen reader can wander out of the menu and read the page underneath with no way
 * of knowing it has left. Marking the page hidden is what makes the overlay modal in the only
 * sense that matters to a screen reader user.
 *
 * The mutation observer is not defensive detail: content is added to the page while an overlay is
 * open — another overlay, a toast, anything lazily rendered — and without watching for it that
 * content would be readable behind the overlay.
 *
 * @returns A function restoring everything this call hid.
 */
export const ariaHideOutside = (
  targets: Element[],
  options: AriaHideOutsideOptions = {},
): (() => void) => {
  const root = options.root ?? document.body;
  const useInert = Boolean(options.shouldUseInert) && supportsInert;
  const visibleNodes = new Set<Element>(targets);
  const hiddenNodes = new Set<Element>();

  const getHidden = (element: Element) =>
    useInert && element instanceof HTMLElement
      ? element.inert
      : element.getAttribute("aria-hidden") === "true";

  const setHidden = (element: Element, hidden: boolean) => {
    if (useInert && element instanceof HTMLElement) {
      element.inert = hidden;
    } else if (hidden) {
      element.setAttribute("aria-hidden", "true");
    } else {
      element.removeAttribute("aria-hidden");

      if (element instanceof HTMLElement) element.inert = false;
    }
  };

  const hide = (node: Element) => {
    const refCount = refCounts.get(node) ?? 0;

    // Already hidden by the page rather than by this call, so it is not ours to restore.
    if (getHidden(node) && refCount === 0) return;

    if (refCount === 0) setHidden(node, true);

    hiddenNodes.add(node);
    refCounts.set(node, refCount + 1);
  };

  const walk = (from: Element) => {
    for (const element of from.querySelectorAll(ALWAYS_VISIBLE_SELECTOR)) {
      visibleNodes.add(element);
    }

    const acceptNode = (node: Element) => {
      // `aria-hidden` is inherited, so there is nothing to gain from hiding a child of a hidden
      // node. A row is the exception: Safari on iOS fails to hide a `role="row"` element, so its
      // cells have to be hidden individually.
      if (
        hiddenNodes.has(node) ||
        visibleNodes.has(node) ||
        (node.parentElement &&
          hiddenNodes.has(node.parentElement) &&
          node.parentElement.getAttribute("role") !== "row")
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      // An ancestor of a target has to stay visible, but its other children do not.
      for (const target of visibleNodes) {
        if (node.contains(target)) return NodeFilter.FILTER_SKIP;
      }

      return NodeFilter.FILTER_ACCEPT;
    };

    const acceptRoot = acceptNode(from);

    // A tree walker never visits its own root.
    if (acceptRoot === NodeFilter.FILTER_ACCEPT) hide(from);

    if (acceptRoot === NodeFilter.FILTER_REJECT) return;

    const walker = document.createTreeWalker(from, NodeFilter.SHOW_ELEMENT, { acceptNode });
    let node = walker.nextNode() as Element | null;

    while (node != null) {
      hide(node);
      node = walker.nextNode() as Element | null;
    }
  };

  // Only the innermost layer watches, so a node added while two overlays are open is hidden once
  // rather than once per layer.
  layers.at(-1)?.disconnect();

  walk(root);

  const observer = new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type !== "childList") continue;
      if (!change.target.isConnected) continue;

      const isInsideKnownSubtree = [...visibleNodes, ...hiddenNodes].some((node) =>
        node.contains(change.target as Node),
      );

      if (isInsideKnownSubtree) continue;

      for (const node of change.addedNodes) {
        if (!(node instanceof Element)) continue;

        if (isAlwaysVisible(node)) visibleNodes.add(node);
        else walk(node);
      }
    }
  });

  const layer: Layer = {
    disconnect: () => observer.disconnect(),
    hiddenNodes,
    observe: () => observer.observe(root, { childList: true, subtree: true }),
    visibleNodes,
  };

  layer.observe();
  layers.push(layer);

  return () => {
    observer.disconnect();

    for (const node of hiddenNodes) {
      const count = refCounts.get(node);

      if (count == null) continue;

      if (count === 1) {
        setHidden(node, false);
        refCounts.delete(node);
      } else {
        refCounts.set(node, count - 1);
      }
    }

    const index = layers.indexOf(layer);

    if (index >= 0) layers.splice(index, 1);

    // Hand watching back to whichever layer is now innermost.
    layers.at(-1)?.observe();
  };
};

/**
 * Exempt an element from the hiding the innermost call applied.
 *
 * A non-modal overlay — a submenu, a combobox listbox — is rendered outside the overlay that
 * opened it, so it would be hidden along with the rest of the page.
 *
 * @returns A function withdrawing the exemption, or `undefined` if nothing is hiding anything.
 */
export const keepVisible = (element: Element): (() => void) | undefined => {
  const layer = layers.at(-1);

  if (!layer || layer.visibleNodes.has(element)) return undefined;

  layer.visibleNodes.add(element);

  return () => {
    layer.visibleNodes.delete(element);
  };
};
