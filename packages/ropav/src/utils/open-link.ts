import type { RouterContext } from "../components/router-provider/router-provider.context";

/** The modifier keys a click carries, which is all `shouldClientNavigate` reads off the event. */
export interface OpenLinkModifiers {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export interface OpenLinkOptions {
  /** The href as the link declared it, before `resolveHref` rewrote it for the DOM. */
  href?: string;
  router: RouterContext | null;
  /** Passed straight through to `navigate`, for whatever the application's router accepts. */
  routerOptions?: unknown;
}

/**
 * Whether the application's router should take this activation rather than the browser.
 *
 * Ported from React Aria's `shouldClientNavigate`. Every case below asks the browser for
 * something a client-side router cannot do, so letting the event through is the whole point.
 */
export const shouldClientNavigate = (
  link: HTMLAnchorElement,
  modifiers: OpenLinkModifiers,
): boolean => {
  // Read the attribute rather than `link.target`: inside an iframe Firefox reports `"_parent"`
  // for a link that declares no target at all, which would rule out every link on the page.
  const target = link.getAttribute("target");

  return (
    (!target || target === "_self") &&
    // A cross-origin href is not the router's to resolve.
    link.origin === window.location.origin &&
    !link.hasAttribute("download") &&
    // New tab on macOS, new tab on Windows, download, new window.
    !modifiers.metaKey &&
    !modifiers.ctrlKey &&
    !modifiers.altKey &&
    !modifiers.shiftKey
  );
};

/**
 * Give a click on an anchor to the application's router, when it is a click the router can serve.
 *
 * Called after the press machinery, from a link's own click handler. Every activation path
 * converges there: a pointer press completes on the click, Enter on an anchor produces a native
 * click because `usePress` carves anchors out of its keyboard default handling, and a screen
 * reader arrives as a virtual click.
 */
export const openLink = (event: MouseEvent, options: OpenLinkOptions): void => {
  const { href, router, routerOptions } = options;

  if (!router || !href) return;

  // Someone already spoke for this click — a consumer's own listener, or the press machinery
  // refusing a disabled link. Whoever called `preventDefault` keeps the last word.
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;

  const link = event.currentTarget;

  if (!(link instanceof HTMLAnchorElement)) return;
  if (!shouldClientNavigate(link, event)) return;

  event.preventDefault();
  router.navigate(href, routerOptions);
};
