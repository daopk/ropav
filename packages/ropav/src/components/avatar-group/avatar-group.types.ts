import type { AvatarGroupVariants, AvatarVariants } from "@ropav/styles";

export interface AvatarGroupRootProps {
  class?: string;
  /**
   * Which avatar is in front. `"last"` is the order the document paints in already, so it costs
   * no stacking rule; `"first"` reverses it. @default "last"
   */
  front?: AvatarGroupVariants["front"];
  /** Axis the avatars are laid out along. @default "horizontal" */
  orientation?: AvatarGroupVariants["orientation"];
  /**
   * How far each avatar tucks under its neighbour, as a share of one avatar. `"none"` spaces them
   * out instead, and drops the ring with it. @default "md"
   */
  overlap?: AvatarGroupVariants["overlap"];
  /** Size for every avatar in the group. Each avatar can still set its own. @default "md" */
  size?: AvatarVariants["size"];
}

export interface AvatarGroupOverflowProps {
  class?: string;
  /**
   * How many avatars are not shown, rendered as `+count`. Write the slot instead where the count
   * needs words around it.
   */
  count?: number;
}
