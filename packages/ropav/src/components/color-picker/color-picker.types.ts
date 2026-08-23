import type { Color } from "../../utils/color-types";
import type { Placement } from "../../utils/position";

export interface ColorPickerRootProps {
  class?: string;
  /** Controlled colour. A string is parsed. */
  value?: Color | string;
  /** Colour the picker starts on while it is uncontrolled. @default "#000000" */
  defaultValue?: Color | string;
  /** Whether the popover starts open. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  isOpen?: boolean;
}

export interface ColorPickerRootSlotProps {
  /** The colour the picker is holding. */
  color: Color;
}

export interface ColorPickerTriggerProps {
  class?: string;
  /** @default "button" */
  type?: "button" | "reset" | "submit";
}

export interface ColorPickerPopoverProps {
  class?: string;
  /** @default "bottom left" */
  placement?: Placement;
  offset?: number;
  crossOffset?: number;
  containerPadding?: number;
  shouldFlip?: boolean;
  isKeyboardDismissDisabled?: boolean;
}
