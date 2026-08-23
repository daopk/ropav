import type {Placement} from "@/utils/position";

export interface PopoverFixtureProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isNonModal?: boolean;
  isKeyboardDismissDisabled?: boolean;
  placement?: Placement;
  shouldFlip?: boolean;
  /** Renders the popover's content without a `Popover.Dialog` around it. */
  withoutDialog?: boolean;
  /** Uses `Popover.Trigger` instead of letting a bare `Button` be the trigger. */
  withCustomTrigger?: boolean;
  withArrow?: boolean;
  /** Supplies the arrow shape through the slot instead of using the default one. */
  withCustomArrow?: boolean;
  withoutHeading?: boolean;
  headingLevel?: number;
  /** Renders a button inside the dialog that closes it through the scoped slot. */
  withCloseFromSlot?: boolean;
  /** Refuses to dismiss when the interaction landed on the element carrying this id. */
  keepOpenFor?: string;
}
