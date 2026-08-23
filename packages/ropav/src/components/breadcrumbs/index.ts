import BreadcrumbsItem from "./breadcrumbs-item.vue";
import BreadcrumbsRoot from "./breadcrumbs-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbsItem,
  Root: BreadcrumbsRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { BreadcrumbsItem, BreadcrumbsRoot };

export type {
  BreadcrumbKey,
  BreadcrumbsItemProps,
  BreadcrumbsItemSlotProps,
  BreadcrumbsRootProps,
  BreadcrumbsRootProps as BreadcrumbsProps,
} from "./breadcrumbs.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { breadcrumbsVariants } from "@ropav/styles";

export type { BreadcrumbsVariants } from "@ropav/styles";
