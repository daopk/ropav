import SwitchGroupRoot from "./switch-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SwitchGroup = Object.assign(SwitchGroupRoot, {
  Root: SwitchGroupRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {SwitchGroupRoot};

export type {
  SwitchGroupRootProps,
  SwitchGroupRootProps as SwitchGroupProps,
} from "./switch-group.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {switchGroupVariants} from "@ropav/styles";

export type {SwitchGroupVariants} from "@ropav/styles";
