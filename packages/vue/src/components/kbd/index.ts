import KbdAbbr from "./kbd-abbr.vue";
import KbdContent from "./kbd-content.vue";
import KbdRoot from "./kbd-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Kbd = Object.assign(KbdRoot, {
  Abbr: KbdAbbr,
  Content: KbdContent,
  Root: KbdRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {KbdAbbr, KbdContent, KbdRoot};

export type {
  KbdAbbrProps,
  KbdContentProps,
  KbdRootProps,
  KbdRootProps as KbdProps,
} from "./kbd.types";

export {kbdKeysLabelMap, kbdKeysMap} from "./kbd.constants";

export type {KbdKey} from "./kbd.constants";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useKbdContext} from "./kbd.context";

export type {KbdContext} from "./kbd.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {kbdVariants} from "@heroui/styles";

export type {KbdVariants} from "@heroui/styles";
