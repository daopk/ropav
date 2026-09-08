import AvatarGroupOverflow from "./avatar-group-overflow.vue";
import AvatarGroupRoot from "./avatar-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { AvatarGroupRoot as AvatarGroup, AvatarGroupOverflow };

export type {
  AvatarGroupRootProps as AvatarGroupProps,
  AvatarGroupOverflowProps,
} from "./avatar-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useAvatarGroupContext } from "./avatar-group.context";

export type { AvatarGroupContext } from "./avatar-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { avatarGroupVariants } from "@ropav/styles";

export type { AvatarGroupVariants } from "@ropav/styles";
