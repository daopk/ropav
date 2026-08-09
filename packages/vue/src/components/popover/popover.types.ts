import type {Placement} from "../../utils/position";

export interface PopoverRootProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
}

export interface PopoverRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface PopoverTriggerProps {
  class?: string;
}

export interface PopoverContentProps {
  class?: string;
  /** Where the popover sits relative to its trigger. @default "bottom" */
  placement?: Placement;
  /** Distance along the main axis, between the popover and its trigger. @default 8 */
  offset?: number;
  /** Distance along the cross axis. @default 0 */
  crossOffset?: number;
  /** Whether the popover may flip to the other side when it does not fit. @default true */
  shouldFlip?: boolean;
  /** Distance kept between the popover and the edge of the viewport. @default 12 */
  containerPadding?: number;
  /** Distance kept between the arrow and the corner of the popover. @default 0 */
  arrowBoundaryOffset?: number;
  /** Whether the page behind the popover stays interactive. @default false */
  isNonModal?: boolean;
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
  /** Filters which outside elements dismiss the popover. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Forces the entry state, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state. */
  isExiting?: boolean;
}

export interface PopoverDialogProps {
  class?: string;
}

export interface PopoverDialogSlotProps {
  /** Closes the popover, for a control inside the dialog that is not a `Popover.Close`. */
  close: () => void;
}

export interface PopoverArrowProps {
  class?: string;
}

export interface PopoverHeadingProps {
  class?: string;
  /** Heading level. @default 2 inside a dialog, 3 on its own */
  level?: number;
}
