import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {ListBoxSectionRoot} from "../list-box-section";

import ListBoxDropIndicator from "./list-box-drop-indicator.vue";
import ListBoxLoadMoreItem from "./list-box-load-more-item.vue";
import ListBoxRoot from "./list-box-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBox = Object.assign(ListBoxRoot, {
  DropIndicator: ListBoxDropIndicator,
  Item: ListBoxItemRoot,
  ItemIndicator: ListBoxItemIndicator,
  LoadMoreItem: ListBoxLoadMoreItem,
  Root: ListBoxRoot,
  Section: ListBoxSectionRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxDropIndicator, ListBoxLoadMoreItem, ListBoxRoot};

export type {
  ListBoxDropIndicatorProps,
  ListBoxLoadMoreItemProps,
  ListBoxRootProps,
  ListBoxRootProps as ListBoxProps,
} from "./list-box.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  provideListBoxStateContext,
  useListBoxContext,
  useListBoxStateContext,
} from "./list-box.context";

export type {ListBoxContext, ListBoxStateContext} from "./list-box.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listboxVariants} from "@heroui/styles";

export type {ListBoxVariants} from "@heroui/styles";
