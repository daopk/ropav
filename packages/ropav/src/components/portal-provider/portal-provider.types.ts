export interface PortalProviderRootProps {
  /**
   * Where every overlay below renders: modals, alert dialogs, drawers, popovers, menus, the
   * listboxes of pickers, tooltips and toast regions. A component's own `portalContainer` still
   * wins.
   *
   * Omitted, it inherits the enclosing provider's container; `null` goes back to the document's
   * body. An element other than the body has to be a containing block for `position: fixed` (a
   * `transform`, or `contain: layout` or `paint`) sized to the area the overlays cover: backdrops
   * fill it, and modals size to it rather than to the visual viewport.
   */
  container?: HTMLElement | string | null;
  /**
   * The part of the page the overlays below belong to, usually an element holding both the content
   * and the `container`. A modal makes only this element `inert` and holds focus and outside
   * presses only within it, and a placed overlay flips and shifts to stay inside it — so an app
   * rendered in a window of a larger page leaves the rest of that page alone.
   *
   * Omitted, it inherits the enclosing provider's root; `null` goes back to the whole document.
   */
  root?: HTMLElement | null;
}
