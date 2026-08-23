import MenuSectionRoot from "./menu-section-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const MenuSection = Object.assign(MenuSectionRoot, {Root: MenuSectionRoot});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {MenuSectionRoot};

export type {
  MenuSectionRootProps,
  MenuSectionRootProps as MenuSectionProps,
} from "./menu-section.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {menuSectionVariants} from "@heroui/styles";

export type {MenuSectionVariants} from "@heroui/styles";
