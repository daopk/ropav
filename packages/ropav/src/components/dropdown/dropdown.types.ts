import type { MenuTriggerType } from "../../composables/use-menu-trigger";
import type { Placement } from "../../utils/position";
import type { MenuRootProps } from "../menu/menu.types";

export interface DropdownRootProps {
  /** How the menu is opened. @default "press" */
  trigger?: MenuTriggerType;
  isOpen?: boolean;
  defaultOpen?: boolean;
  /** Disables the trigger, so the menu cannot be opened. */
  isDisabled?: boolean;
}

export interface DropdownRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface DropdownTriggerProps {
  class?: string;
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
}

export interface DropdownPopoverProps {
  class?: string;
  /** Overrides where the popover sits relative to its trigger. */
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
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
}

/**
 * The menu inside a dropdown. Everything a standalone menu takes, minus the naming, the ids and the
 * focus strategy, all of which the trigger decides.
 */
export type DropdownMenuProps = Omit<
  MenuRootProps,
  "ariaLabel" | "ariaLabelledby" | "autoFocus" | "id"
>;
