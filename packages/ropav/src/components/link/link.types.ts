/** What the browser accepts for `referrerpolicy` on an anchor. */
export type LinkReferrerPolicy =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

/**
 * What assistive technology accepts for `aria-current`, plus `"auto"`.
 *
 * `"auto"` is not an ARIA token and never reaches the DOM. It asks the router supplied by
 * `RouterProvider` whether this link's href addresses the route showing now, resolving to
 * `"page"` when it does and to nothing at all when it does not — or when no router was supplied.
 */
export type LinkCurrent =
  | boolean
  | "auto"
  | "date"
  | "false"
  | "location"
  | "page"
  | "step"
  | "time"
  | "true";

export interface LinkRootProps {
  class?: string;
  /** Where the link goes. Without one the link renders as a span with a link role. */
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  ping?: string;
  referrerPolicy?: LinkReferrerPolicy;
  hrefLang?: string;
  /**
   * Whether the link is disabled. A disabled link renders as a span rather than an anchor, so
   * there is no href for the browser to follow, matching React.
   */
  isDisabled?: boolean;
  /** Marks the link as the one for the current page. `"auto"` asks the router instead. */
  ariaCurrent?: LinkCurrent;
  /**
   * Passed through to the router's `navigate` alongside the href, for whatever options the
   * application's router accepts. Ignored without a `RouterProvider` above.
   */
  routerOptions?: unknown;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

/** State the root hands to its slot, matching React's link render props. */
export interface LinkRootSlotProps {
  isCurrent: boolean;
  isDisabled: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
}

export interface LinkIconProps {
  class?: string;
}
