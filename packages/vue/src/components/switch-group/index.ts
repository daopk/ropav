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
export {switchGroupVariants} from "@heroui/styles";

export type {SwitchGroupVariants} from "@heroui/styles";
