import type {TextAreaVariants} from "@heroui/styles";

export interface TextAreaRootProps {
  class?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: TextAreaVariants["variant"];
  /** Whether the control stretches to fill its container. */
  fullWidth?: TextAreaVariants["fullWidth"];
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}
