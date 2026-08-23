import type {ButtonVariants} from "@heroui/styles";

export interface ButtonGroupRootProps {
  class?: string;
  /** Stretches the group to the full width of its container. */
  fullWidth?: boolean;
  /** Disables every button in the group. */
  isDisabled?: boolean;
  /**
   * Direction the buttons are laid out in. Falls back to the axis of an enclosing
   * Toolbar. @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /** Size for every button in the group. Each button can still set its own. */
  size?: ButtonVariants["size"];
  /** Variant for every button in the group. Each button can still set its own. */
  variant?: ButtonVariants["variant"];
}

export interface ButtonGroupSeparatorProps {
  class?: string;
}
