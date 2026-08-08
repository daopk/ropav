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

/** What assistive technology accepts for `aria-current`. */
export type LinkCurrent =
  | boolean
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
  /** Marks the link as the one for the current page. */
  ariaCurrent?: LinkCurrent;
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
