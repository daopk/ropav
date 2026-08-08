import LinkIcon from "./link-icon.vue";
import LinkRoot from "./link-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a link, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Link = Object.assign(LinkRoot, {
  Root: LinkRoot,
  Icon: LinkIcon,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {LinkIcon, LinkRoot};

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
export {provideLinkContext, useLinkContext} from "./link.context";

export type {LinkContext} from "./link.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {linkVariants} from "@heroui/styles";

export type {LinkVariants} from "@heroui/styles";
