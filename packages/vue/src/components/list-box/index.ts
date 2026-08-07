import {ListBoxItemIndicator, ListBoxItemRoot} from "../list-box-item";
import {ListBoxSectionRoot} from "../list-box-section";

import ListBoxRoot from "./list-box-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBox = Object.assign(ListBoxRoot, {
  Item: ListBoxItemRoot,
  ItemIndicator: ListBoxItemIndicator,
  Root: ListBoxRoot,
  Section: ListBoxSectionRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxRoot};

export type {ListBoxRootProps, ListBoxRootProps as ListBoxProps} from "./list-box.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useListBoxContext} from "./list-box.context";

export type {ListBoxContext} from "./list-box.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listboxVariants} from "@heroui/styles";

export type {ListBoxVariants} from "@heroui/styles";
