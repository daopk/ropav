export interface LinkFixtureProps {
  class?: string;
  href?: string;
  target?: string;
  rel?: string;
  isDisabled?: boolean;
  ariaCurrent?: "page" | "step";
  download?: string | boolean;
  /** Sets no optional prop at all, as a caller writing the bare component does. */
  bare?: boolean;
  ariaLabel?: string;
  /** Renders a `Link.Icon` at all. */
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
