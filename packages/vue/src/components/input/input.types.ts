import type {InputVariants} from "@heroui/styles";

export interface InputRootProps {
  class?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: InputVariants["variant"];
  /** Whether the control stretches to fill its container. */
  fullWidth?: InputVariants["fullWidth"];
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}
