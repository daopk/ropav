import type {SpinnerVariants} from "@heroui/styles";

export interface SpinnerRootProps {
  class?: string;
  /** Spinner color. `current` inherits the surrounding text color. @default "accent" */
  color?: SpinnerVariants["color"];
  /** Spinner size. @default "md" */
  size?: SpinnerVariants["size"];
}
