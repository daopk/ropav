import SpinnerRoot from "./spinner-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Spinner = Object.assign(SpinnerRoot, {
  Root: SpinnerRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SpinnerRoot };

export type { SpinnerRootProps, SpinnerRootProps as SpinnerProps } from "./spinner.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { spinnerVariants } from "@ropav/styles";

export type { SpinnerVariants } from "@ropav/styles";
