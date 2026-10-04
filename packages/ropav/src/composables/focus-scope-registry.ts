import { regionsOverlap } from "../utils/region";

export interface RegisteredScope {
  root: () => HTMLElement | null;
  contain: () => boolean;
  /** The part of the page the scope belongs to, `null` for the whole document. */
  region: () => Element | null;
}

/**
 * Registered scopes, outermost first.
 *
 * Module-level because containment is a question about the whole page, not about one overlay:
 * only the innermost containing scope may hold focus, and focus moving into a scope nested
 * inside it has to be allowed through rather than pulled back.
 */
const scopes: RegisteredScope[] = [];

/**
 * The innermost scope holding focus in a region, among the scopes whose region overlaps it.
 *
 * Without a region every scope overlaps every other, which is the page-wide question. With one, a
 * modal in one app's window is not shadowed by a modal another app opened later in its own.
 */
export const innermostContainingScope = (region: Element | null = null): RegisteredScope | null => {
  for (let index = scopes.length - 1; index >= 0; index--) {
    const scope = scopes[index]!;

    if (scope.contain() && regionsOverlap(scope.region(), region)) return scope;
  }

  return null;
};

/**
 * Whether the element sits inside any registered scope.
 *
 * Any scope rather than only the descendants of one, because an overlay opened from inside
 * another is a **sibling** in the DOM rather than a descendant — a submenu renders into its root
 * popover's container, and a dropdown opened from a popover makes a container of its own. There
 * is no tree to walk here, so a scope boundary is the thing that answers "focus is still in an
 * overlay". React Aria walks its scope tree and asks the narrower question; the difference shows
 * only when two unrelated overlays are open at once and focus moves between them, where this
 * errs towards leaving them open.
 */
export const isElementInAnyFocusScope = (element: Element): boolean =>
  scopes.some((scope) => scope.root()?.contains(element));

/** Add a scope as the innermost, returning its removal. */
export const registerFocusScope = (scope: RegisteredScope): (() => void) => {
  scopes.push(scope);

  return () => {
    const index = scopes.indexOf(scope);

    if (index >= 0) scopes.splice(index, 1);
  };
};
