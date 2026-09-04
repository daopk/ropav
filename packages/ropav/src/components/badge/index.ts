import BadgeAnchor from "./badge-anchor.vue";
import BadgeLabel from "./badge-label.vue";
import BadgeRoot from "./badge-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { BadgeAnchor, BadgeLabel, BadgeRoot as Badge };

export type {
  BadgeAnchorProps,
  BadgeLabelProps,
  BadgeRootProps as BadgeProps,
} from "./badge.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { badgeVariants } from "@ropav/styles";

export type { BadgeVariants } from "@ropav/styles";
