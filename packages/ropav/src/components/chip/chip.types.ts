import type { ChipVariants } from "@ropav/styles";

export interface ChipRootProps {
  class?: string;
  /** Chip color. @default "default" */
  color?: ChipVariants["color"];
  /** Chip size. */
  size?: ChipVariants["size"];
  /** Chip variant. @default "secondary" */
  variant?: ChipVariants["variant"];
}

export interface ChipLabelProps {
  class?: string;
}
