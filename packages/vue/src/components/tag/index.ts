import TagRemoveButton from "./tag-remove-button.vue";
import TagRoot from "./tag-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Tag = Object.assign(TagRoot, {
  RemoveButton: TagRemoveButton,
  Root: TagRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TagRemoveButton, TagRoot};

export type {
  TagRemoveButtonProps,
  TagRootProps,
  TagRootProps as TagProps,
  TagSlotProps,
} from "./tag.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useTagContext} from "./tag.context";

export type {TagContext} from "./tag.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tagVariants} from "@heroui/styles";

export type {TagVariants} from "@heroui/styles";
