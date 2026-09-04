import ListBoxItemIndicator from "./list-box-item-indicator.vue";
import ListBoxItemRoot from "./list-box-item-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ListBoxItemIndicator, ListBoxItemRoot as ListBoxItem };

export type {
  ListBoxItemIndicatorProps,
  ListBoxItemIndicatorSlotProps,
  ListBoxItemRootProps as ListBoxItemProps,
  ListBoxItemSlotProps,
} from "./list-box-item.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useListBoxItemContext } from "./list-box-item.context";

export type { ListBoxItemContext } from "./list-box-item.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { listboxItemVariants } from "@ropav/styles";

export type { ListBoxItemVariants } from "@ropav/styles";
