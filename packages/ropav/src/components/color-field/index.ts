import ColorFieldRoot from "./color-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ColorFieldRoot as ColorField };

export type {
  ColorFieldRootProps as ColorFieldProps,
  ColorFieldRootSlotProps as ColorFieldSlotProps,
} from "./color-field.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { colorFieldVariants } from "@ropav/styles";

export type { ColorFieldVariants } from "@ropav/styles";
