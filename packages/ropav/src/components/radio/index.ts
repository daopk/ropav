import RadioContent from "./radio-content.vue";
import RadioControl from "./radio-control.vue";
import RadioIndicator from "./radio-indicator.vue";
import RadioRoot from "./radio-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Radio = Object.assign(RadioRoot, {
  Content: RadioContent,
  Control: RadioControl,
  Indicator: RadioIndicator,
  Root: RadioRoot,
});

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
