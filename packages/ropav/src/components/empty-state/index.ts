import EmptyStateRoot from "./empty-state-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const EmptyState = Object.assign(EmptyStateRoot, {
  Root: EmptyStateRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {EmptyStateRoot};

export type {
  EmptyStateRootProps,
  EmptyStateRootProps as EmptyStateProps,
} from "./empty-state.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {emptyStateVariants} from "@ropav/styles";

export type {EmptyStateVariants} from "@ropav/styles";
