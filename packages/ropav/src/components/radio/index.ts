import RadioContent from "./radio-content.vue";
import RadioControl from "./radio-control.vue";
import RadioIndicator from "./radio-indicator.vue";
import RadioRoot from "./radio-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Radio = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Content: RadioContent,
  Control: RadioControl,
  Indicator: RadioIndicator,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {RadioRoot, RadioContent, RadioControl, RadioIndicator};

export type {
  RadioRootProps,
  RadioRootProps as RadioProps,
  RadioContentProps,
  RadioControlProps,
  RadioIndicatorProps,
  RadioSlotProps,
  RadioContentSlotProps,
} from "./radio.types";

export {useRadioContext, provideRadioContext} from "./radio.context";

export type {RadioContext} from "./radio.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radioVariants} from "@ropav/styles";

export type {RadioVariants} from "@ropav/styles";
