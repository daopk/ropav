export interface RegisteredScope {
  root: () => HTMLElement | null;
  contain: () => boolean;
}

/**
 * Registered scopes, outermost first.
 *
 * Module-level because containment is a question about the whole page, not about one overlay:
 * only the innermost containing scope may hold focus, and focus moving into a scope nested
 * inside it has to be allowed through rather than pulled back.
 */
const scopes: RegisteredScope[] = [];

export const innermostContainingScope = (): RegisteredScope | null => {
  for (let index = scopes.length - 1; index >= 0; index--) {
    const scope = scopes[index]!;

    if (scope.contain()) return scope;
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
