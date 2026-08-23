import ListBoxSectionRoot from "./list-box-section-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBoxSection = Object.assign(ListBoxSectionRoot, {
  Root: ListBoxSectionRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxSectionRoot};

export type {
  ListBoxSectionRootProps,
  ListBoxSectionRootProps as ListBoxSectionProps,
} from "./list-box-section.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listboxSectionVariants} from "@ropav/styles";
