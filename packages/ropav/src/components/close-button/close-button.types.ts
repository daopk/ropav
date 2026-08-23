import type {CloseButtonVariants} from "@ropav/styles";

export interface CloseButtonRootProps {
  class?: string;
  /** Disables the button. */
  isDisabled?: boolean;
  /** Marks the action as in flight: the button stays focusable but stops activating. */
  isPending?: boolean;
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
  /** Close button variant. */
  variant?: CloseButtonVariants["variant"];
}

export interface CloseButtonSlotProps {
  isDisabled: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPending: boolean;
  isPressed: boolean;
}
