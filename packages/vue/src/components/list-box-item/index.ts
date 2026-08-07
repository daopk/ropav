import ListBoxItemIndicator from "./list-box-item-indicator.vue";
import ListBoxItemRoot from "./list-box-item-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBoxItem = Object.assign(ListBoxItemRoot, {
  Indicator: ListBoxItemIndicator,
  Root: ListBoxItemRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxItemIndicator, ListBoxItemRoot};

export type {
  ListBoxItemIndicatorProps,
  ListBoxItemIndicatorSlotProps,
  ListBoxItemRootProps,
  ListBoxItemRootProps as ListBoxItemProps,
  ListBoxItemSlotProps,
} from "./list-box-item.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useListBoxItemContext} from "./list-box-item.context";

export type {ListBoxItemContext} from "./list-box-item.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listboxItemVariants} from "@heroui/styles";

export type {ListBoxItemVariants} from "@heroui/styles";
