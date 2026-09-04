import type { LinkCurrent } from "@/components/link";

export interface LinkFixtureProps {
  class?: string;
  href?: string;
  target?: string;
  rel?: string;
  isDisabled?: boolean;
  ariaCurrent?: LinkCurrent;
  /** Handed to the router alongside the href, so a test can watch it arrive. */
  routerOptions?: unknown;
  download?: string | boolean;
  /** Sets no optional prop at all, as a caller writing the bare component does. */
  bare?: boolean;
  ariaLabel?: string;
  /** Renders a `LinkIcon` at all. */
  withIcon?: boolean;
  /** Puts custom content inside the icon instead of the built-in glyph. */
  customIcon?: boolean;
  /** Renders the icon ahead of the text rather than after it. */
  iconFirst?: boolean;
  iconClass?: string;
  /** Wraps the link in a `<fieldset disabled>`, to check the state reaches it. */
  inDisabledFieldset?: boolean;
  onClick?: (event: MouseEvent) => void;
}

/** The link under a `RouterProvider`, for the navigation tests. */
export interface LinkRouterFixtureProps extends LinkFixtureProps {
  navigate: (href: string, options?: unknown) => void;
  isCurrent?: (href: string) => boolean;
  resolveHref?: (href: string) => string;
}
