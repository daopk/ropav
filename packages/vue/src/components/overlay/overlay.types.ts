import type {Placement} from "../../utils/position";

export interface OverlayPopoverProps {
  class?: string;
  /**
   * Rendered as `data-slot`.
   *
   * Declared rather than left to attribute fallthrough: this component's root is a `Teleport`, so
   * there is no single element for a stray attribute to land on.
   */
  dataSlot?: string;
  /** Overrides where the overlay sits relative to its trigger. */
  placement?: Placement;
  /** Distance along the main axis, between the overlay and its trigger. @default 8 */
  offset?: number;
  /** Distance along the cross axis. @default 0 */
  crossOffset?: number;
  /** Whether the overlay may flip to the other side when it does not fit. @default true */
  shouldFlip?: boolean;
  /** Distance kept between the overlay and the edge of the viewport. @default 12 */
  containerPadding?: number;
  /** Distance kept between the arrow and the corner of the overlay. @default 0 */
  arrowBoundaryOffset?: number;
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
  /** Forces the entry state, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state. */
  isExiting?: boolean;
}

export interface OverlayArrowProps {
  class?: string;
}
