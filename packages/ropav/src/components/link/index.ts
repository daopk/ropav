import LinkIcon from "./link-icon.vue";
import LinkRoot from "./link-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Link = Object.assign(LinkRoot, {
  Icon: LinkIcon,
  Root: LinkRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { LinkIcon, LinkRoot };

export type {
  LinkRootProps,
  LinkRootProps as LinkProps,
  LinkRootSlotProps,
  LinkIconProps,
  LinkCurrent,
  LinkReferrerPolicy,
} from "./link.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideLinkContext, useLinkContext } from "./link.context";

export type { LinkContext } from "./link.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { linkVariants } from "@ropav/styles";

export type { LinkVariants } from "@ropav/styles";
