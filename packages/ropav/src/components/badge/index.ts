import BadgeAnchor from "./badge-anchor.vue";
import BadgeLabel from "./badge-label.vue";
import BadgeRoot from "./badge-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Badge = Object.assign(BadgeRoot, {
  Anchor: BadgeAnchor,
  Label: BadgeLabel,
  Root: BadgeRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { BadgeAnchor, BadgeLabel, BadgeRoot };

export type {
  BadgeAnchorProps,
  BadgeLabelProps,
  BadgeRootProps,
  BadgeRootProps as BadgeProps,
} from "./badge.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { badgeVariants } from "@ropav/styles";

export type { BadgeVariants } from "@ropav/styles";
