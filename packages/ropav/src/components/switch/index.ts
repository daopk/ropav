import SwitchContent from "./switch-content.vue";
import SwitchControl from "./switch-control.vue";
import SwitchIcon from "./switch-icon.vue";
import SwitchRoot from "./switch-root.vue";
import SwitchThumb from "./switch-thumb.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Switch = Object.assign(SwitchRoot, {
  Content: SwitchContent,
  Control: SwitchControl,
  Icon: SwitchIcon,
  Root: SwitchRoot,
  Thumb: SwitchThumb,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SwitchRoot, SwitchContent, SwitchControl, SwitchThumb, SwitchIcon };

export type {
  SwitchRootProps,
  SwitchRootProps as SwitchProps,
  SwitchContentProps,
  SwitchControlProps,
  SwitchThumbProps,
  SwitchIconProps,
  SwitchSlotProps,
  SwitchContentSlotProps,
} from "./switch.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { switchVariants } from "@ropav/styles";

export type { SwitchVariants } from "@ropav/styles";
