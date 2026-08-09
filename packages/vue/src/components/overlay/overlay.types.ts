import type {OverlaySlotContexts} from "./overlay-slots";
import type {Placement} from "../../utils/position";

export interface OverlayPopoverProps {
  class?: string;
  /**
   * The contexts offered to the content inside, when a wrapper owns them.
   *
   * A wrapper has to, because a `provide` from here would not reach content forwarded into this
   * overlay's slot from outside. Omitted for an overlay used on its own.
   */
  slotContexts?: OverlaySlotContexts;
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
  /**
   * Whether the page behind stays interactive. Overrides what the trigger declared, because this
   * is a property of the overlay rather than of the thing that opened it.
   */
  isNonModal?: boolean;
  /** Filters which outside elements dismiss the overlay. Overrides the trigger's own filter. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
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
