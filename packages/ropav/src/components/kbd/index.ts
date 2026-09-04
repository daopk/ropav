import KbdAbbr from "./kbd-abbr.vue";
import KbdContent from "./kbd-content.vue";
import KbdRoot from "./kbd-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { KbdAbbr, KbdContent, KbdRoot as Kbd };

export type { KbdAbbrProps, KbdContentProps, KbdRootProps as KbdProps } from "./kbd.types";

export { kbdKeysLabelMap, kbdKeysMap } from "./kbd.constants";

export type { KbdKey } from "./kbd.constants";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useKbdContext } from "./kbd.context";

export type { KbdContext } from "./kbd.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { kbdVariants } from "@ropav/styles";

export type { KbdVariants } from "@ropav/styles";
