export interface RouterProviderRootProps {
  /**
   * Performs a client-side navigation to `href`. In a vue-router application this is
   * `(href, options) => router.push({path: href, ...options})`.
   *
   * Receives the href as the link declared it, so a router gets back the path it was given
   * rather than the one `resolveHref` produced for the DOM.
   */
  navigate: (href: string, options?: unknown) => void;
  /**
   * Whether an href addresses the route showing now, for links that ask with `aria-current="auto"`.
   *
   * The matching rule is yours: `(href) => route.path === href` for an exact match,
   * `(href) => route.path.startsWith(href)` for a section. Omitted, no link resolves as current.
   */
  isCurrent?: (href: string) => boolean;
  /**
   * Rewrites an app-relative href into the URL the anchor should carry, for a router mounted
   * under a base path or running in hash mode — `(href) => router.resolve(href).href`.
   * Omitted, the href renders as written.
   */
  resolveHref?: (href: string) => string;
}
