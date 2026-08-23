import type {ButtonVariants} from "@ropav/styles";

/** State handed to the default slot, so content can follow the button's own state. */
export interface ButtonSlotProps {
  isDisabled: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPending: boolean;
  isPressed: boolean;
}

export interface ButtonRootProps {
  class?: string;
  /** Stretches the button to the full width of its container. */
  fullWidth?: boolean;
  /** Disables the button. */
  isDisabled?: boolean;
  /** Renders the icon-only shape, for a button whose content is a single icon. */
  isIconOnly?: boolean;
  /**
   * Marks an in-flight action. Renders `data-pending` and blocks activation, while
   * keeping the button focusable so assistive technology can still reach it.
   */
  isPending?: boolean;
  /** Button size. @default "md" */
  size?: ButtonVariants["size"];
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
  /** Button variant. @default "primary" */
  variant?: ButtonVariants["variant"];
}
