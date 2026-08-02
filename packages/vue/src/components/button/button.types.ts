import type {ButtonVariants} from "@heroui/styles";

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
