import SwitchContent from "./switch-content.vue";
import SwitchControl from "./switch-control.vue";
import SwitchIcon from "./switch-icon.vue";
import SwitchRoot from "./switch-root.vue";
import SwitchThumb from "./switch-thumb.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SwitchRoot as Switch, SwitchContent, SwitchControl, SwitchThumb, SwitchIcon };

export type {
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
