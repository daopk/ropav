import TagRemoveButton from "./tag-remove-button.vue";
import TagRoot from "./tag-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { TagRemoveButton, TagRoot as Tag };

export type { TagRemoveButtonProps, TagRootProps as TagProps, TagSlotProps } from "./tag.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useTagContext } from "./tag.context";

export type { TagContext } from "./tag.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { tagVariants } from "@ropav/styles";

export type { TagVariants } from "@ropav/styles";
