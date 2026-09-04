import BreadcrumbsItem from "./breadcrumbs-item.vue";
import BreadcrumbsRoot from "./breadcrumbs-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { BreadcrumbsItem, BreadcrumbsRoot as Breadcrumbs };

export type {
  BreadcrumbKey,
  BreadcrumbsItemProps,
  BreadcrumbsItemSlotProps,
  BreadcrumbsRootProps as BreadcrumbsProps,
} from "./breadcrumbs.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { breadcrumbsVariants } from "@ropav/styles";

export type { BreadcrumbsVariants } from "@ropav/styles";
