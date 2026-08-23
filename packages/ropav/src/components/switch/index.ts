import SwitchContent from "./switch-content.vue";
import SwitchControl from "./switch-control.vue";
import SwitchIcon from "./switch-icon.vue";
import SwitchRoot from "./switch-root.vue";
import SwitchThumb from "./switch-thumb.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a switch, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Switch = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Content: SwitchContent,
  Control: SwitchControl,
  Thumb: SwitchThumb,
  Icon: SwitchIcon,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {SwitchRoot, SwitchContent, SwitchControl, SwitchThumb, SwitchIcon};

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
export {switchVariants} from "@ropav/styles";

export type {SwitchVariants} from "@ropav/styles";
