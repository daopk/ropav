import TagGroupList from "./tag-group-list.vue";
import TagGroupRoot from "./tag-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TagGroup = Object.assign(TagGroupRoot, {
  List: TagGroupList,
  Root: TagGroupRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TagGroupList, TagGroupRoot};

export type {
  TagGroupListProps,
  TagGroupRootProps,
  TagGroupRootProps as TagGroupProps,
} from "./tag-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useTagGroupContext} from "./tag-group.context";

export type {TagGroupContext} from "./tag-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tagGroupVariants} from "@heroui/styles";

export type {TagGroupVariants} from "@heroui/styles";
