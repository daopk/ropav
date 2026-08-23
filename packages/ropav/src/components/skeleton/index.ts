import SkeletonRoot from "./skeleton-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Skeleton = Object.assign(SkeletonRoot, {
  Root: SkeletonRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {SkeletonRoot};

export type {SkeletonRootProps, SkeletonRootProps as SkeletonProps} from "./skeleton.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {skeletonVariants} from "@ropav/styles";

export type {SkeletonVariants} from "@ropav/styles";
