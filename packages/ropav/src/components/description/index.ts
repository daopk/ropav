import DescriptionRoot from "./description-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Description = Object.assign(DescriptionRoot, {
  Root: DescriptionRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {DescriptionRoot};

export type {
  DescriptionRootProps,
  DescriptionRootProps as DescriptionProps,
} from "./description.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {descriptionVariants} from "@heroui/styles";

export type {DescriptionVariants} from "@heroui/styles";
