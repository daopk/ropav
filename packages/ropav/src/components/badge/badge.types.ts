import type {BadgeVariants} from "@ropav/styles";

export interface BadgeAnchorProps {
  class?: string;
}

export interface BadgeRootProps {
  class?: string;
  /** Badge color. */
  color?: BadgeVariants["color"];
  /** Badge placement. */
  placement?: BadgeVariants["placement"];
  /** Badge size. */
  size?: BadgeVariants["size"];
  /** Badge variant. */
  variant?: BadgeVariants["variant"];
}

export interface BadgeLabelProps {
  class?: string;
}
