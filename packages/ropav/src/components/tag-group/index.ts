import TagGroupList from "./tag-group-list.vue";
import TagGroupRoot from "./tag-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { TagGroupList, TagGroupRoot as TagGroup };

export type { TagGroupListProps, TagGroupRootProps as TagGroupProps } from "./tag-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useTagGroupContext } from "./tag-group.context";

export type { TagGroupContext } from "./tag-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { tagGroupVariants } from "@ropav/styles";

export type { TagGroupVariants } from "@ropav/styles";
