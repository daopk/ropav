import DisclosureGroupRoot from "./disclosure-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DisclosureGroup = Object.assign(DisclosureGroupRoot, {
  Root: DisclosureGroupRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {DisclosureGroupRoot};

export type {
  DisclosureGroupRootProps,
  DisclosureGroupRootProps as DisclosureGroupProps,
} from "./disclosure-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useDisclosureGroupContext} from "./disclosure-group.context";

export type {DisclosureGroupContext} from "./disclosure-group.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export {useDisclosureGroupNavigation} from "../../composables/use-disclosure-group-navigation";

export type {
  UseDisclosureGroupNavigationOptions,
  UseDisclosureGroupNavigationReturn,
} from "../../composables/use-disclosure-group-navigation";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {disclosureGroupVariants} from "@heroui/styles";

export type {DisclosureGroupVariants} from "@heroui/styles";
