import type { BadgeVariants } from "@ropav/styles";

export interface BadgeAnchorProps {
  class?: string;
}

export interface BadgeRootProps {
  class?: string;
  /** Badge color. @default "default" */
  color?: BadgeVariants["color"];
  /** Badge placement. @default "top-right" */
  placement?: BadgeVariants["placement"];
  /** Badge size. @default "md" */
  size?: BadgeVariants["size"];
  /** Badge variant. @default "primary" */
  variant?: BadgeVariants["variant"];
}

export interface BadgeLabelProps {
  class?: string;
}
