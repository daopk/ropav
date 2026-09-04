import LinkIcon from "./link-icon.vue";
import LinkRoot from "./link-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { LinkIcon, LinkRoot as Link };

export type {
  LinkRootProps as LinkProps,
  LinkRootSlotProps as LinkSlotProps,
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
