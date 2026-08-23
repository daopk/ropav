import type {SkeletonVariants} from "@heroui/styles";

export interface SkeletonRootProps {
  class?: string;
  /** Animation type. Falls back to the theme's `--skeleton-animation` value. */
  animationType?: SkeletonVariants["animationType"];
}
