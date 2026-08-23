import type { ChipVariants } from "@ropav/styles";

export interface ChipRootProps {
  class?: string;
  /** Chip color. */
  color?: ChipVariants["color"];
  /** Chip size. */
  size?: ChipVariants["size"];
  /** Chip variant. */
  variant?: ChipVariants["variant"];
}

export interface ChipLabelProps {
  class?: string;
}
