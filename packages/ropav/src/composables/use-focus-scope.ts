import type { RegisteredScope } from "./focus-scope-registry";
import type { MaybeRefOrGetter } from "vue";

import { onScopeDispose, toValue, watch } from "vue";

import { tabbableIn } from "../utils/focus";

import {
  innermostContainingScope,
  isElementInAnyFocusScope,
  registerFocusScope,
} from "./focus-scope-registry";

export interface UseFocusScopeOptions {
  /** The element the scope covers. */
  scopeRef: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** Whether the scope is live. A closed overlay registers nothing. */
  isActive?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Keeps Tab cycling inside the scope, and pulls focus back if it escapes.
   *
   * @default false
   */
  contain?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Returns focus to whatever held it before the scope opened.
   *
   * @default false
   */
  restoreFocus?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Focuses the scope when it opens. `"first"` and `"last"` pick an end of the scope's
   * focusable content; `true` focuses the scope element itself.
   *
   * @default false
   */
  autoFocus?: MaybeRefOrGetter<boolean | "first" | "last" | undefined>;
  /**
   * The part of the page containment holds focus within. Focus moving to something outside it —
   * another app's window beside this one — is left alone rather than pulled back, and Tab pressed
   * out there is not taken over. `null` or absent: the whole document.
   */
  region?: MaybeRefOrGetter<Element | null | undefined>;
}

/**
 * Keep focus inside an overlay and give it back when the overlay closes, ported from React
 * Aria's `FocusScope`.
 *
 * An overlay is rendered at the end of the document, so the tab order the user sees has nothing
 * to do with where the trigger sits — tabbing out of a menu would jump to whatever happens to
 * follow in the body. Containment closes the loop, and restoration puts focus back on the
 * trigger, which is also what keeps a keyboard user from being dropped at the top of the page
 * when the overlay closes.
 *
 * React Aria delimits a scope with a pair of hidden sentinel elements, because a React scope can
 * span several sibling elements. Here a scope is always one element, so the element is the
 * boundary and no sentinels are rendered.
 *
 * @example
 * ```ts
 * useFocusScope({
 *   autoFocus: true,
 *   contain: true,
 *   isActive: () => state.isOpen.value,
 *   restoreFocus: true,
 *   scopeRef: popoverElement,
 * });
 * ```
 */
export const useFocusScope = (options: UseFocusScopeOptions): void => {
  const getRoot = () => toValue(options.scopeRef) ?? null;
  const scope: RegisteredScope = {
    contain: () => Boolean(toValue(options.contain)),
    region: () => toValue(options.region) ?? null,
    root: getRoot,
  };

  /** Whether an element is somewhere this scope has any say over. */
  const isInRegion = (element: Element | null) => {
    const region = scope.region();

    return !region || !element || region.contains(element);
  };

  const focusElement = (element: HTMLElement | null) => {
    // Never scrolls: an overlay is positioned by measurement, and letting focus scroll the page
    // under it would leave it beside nothing.
    element?.focus({ preventScroll: true });
  };

  const focusEnd = (root: HTMLElement, end: "first" | "last") => {
    const focusable = tabbableIn(root);
    const target = end === "first" ? focusable[0] : focusable.at(-1);

    // Falls back to the scope itself, which is focusable precisely so that an overlay with no
    // focusable content still takes focus rather than leaving it outside.
    focusElement(target ?? root);
  };

  const listeners: (() => void)[] = [];

  const detach = () => {
    for (const remove of listeners.splice(0)) remove();
  };

  const attach = (root: HTMLElement) => {
    const ownerDocument = root.ownerDocument;

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (innermostContainingScope(scope.region()) !== scope) return;
      if (!isInRegion(ownerDocument.activeElement)) return;

      const focusable = tabbableIn(root);

      if (focusable.length === 0) {
        // Nothing to move to, so the scope element keeps focus rather than letting Tab out.
        event.preventDefault();
        focusElement(root);

        return;
      }

      const active = ownerDocument.activeElement as HTMLElement | null;
      const index = active ? focusable.indexOf(active) : -1;
      const step = event.shiftKey ? -1 : 1;
      // Wraps, which is the whole point: the loop is what keeps focus in.
      const next = focusable[(index + step + focusable.length) % focusable.length]!;

      event.preventDefault();
      focusElement(next);
    };

    const onFocusin = (event: FocusEvent) => {
      if (innermostContainingScope(scope.region()) !== scope) return;

      const target = event.target;

      if (!(target instanceof Element)) return;
      if (!isInRegion(target)) return;
      // A submenu is a sibling of the menu it belongs to rather than a descendant, so
      // containment has to allow focus into any scope, not only into this one.
      if (isElementInAnyFocusScope(target)) return;

      focusElement(root);
    };

    ownerDocument.addEventListener("keydown", onKeydown, true);
    ownerDocument.addEventListener("focusin", onFocusin, true);

    listeners.push(() => {
      ownerDocument.removeEventListener("keydown", onKeydown, true);
      ownerDocument.removeEventListener("focusin", onFocusin, true);
    });
  };

  watch(
    [() => getRoot(), () => toValue(options.isActive) ?? true],
    ([root, isActive], _previous, onCleanup) => {
      detach();

      if (!root || !isActive) return;

      // Captured before anything inside the scope takes focus, so this is genuinely the
      // element the user came from.
      const previouslyFocused = root.ownerDocument.activeElement as HTMLElement | null;

      const unregister = registerFocusScope(scope);

      attach(root);

      const autoFocus = toValue(options.autoFocus);

      if (autoFocus === "first" || autoFocus === "last") focusEnd(root, autoFocus);
      else if (autoFocus) focusElement(root);

      onCleanup(() => {
        detach();

        unregister();

        if (!toValue(options.restoreFocus)) return;

        const active = root.ownerDocument.activeElement;
        // Only restore when focus is still ours to give back. If the user has already moved
        // focus somewhere else, taking it away would be the rude thing to do.
        const shouldRestore =
          !active || active === root.ownerDocument.body || root.contains(active);

        if (!shouldRestore) return;
        // The trigger may have been removed along with the overlay.
        if (!previouslyFocused?.isConnected) return;

        focusElement(previouslyFocused);
      });
    },
    { flush: "post", immediate: true },
  );

  onScopeDispose(() => detach(), true);
};
