import AlertContent from "./alert-content.vue";
import AlertDescription from "./alert-description.vue";
import AlertIndicator from "./alert-indicator.vue";
import AlertRoot from "./alert-root.vue";
import AlertTitle from "./alert-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors `@heroui/react`.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Alert = Object.assign(AlertRoot, {
  Root: AlertRoot,
  Indicator: AlertIndicator,
  Content: AlertContent,
  Title: AlertTitle,
  Description: AlertDescription,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle};

export type {
  AlertContentProps,
  AlertDescriptionProps,
  AlertIndicatorProps,
  AlertRootProps,
  AlertRootProps as AlertProps,
  AlertTitleProps,
} from "./alert.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {alertVariants} from "@ropav/styles";

export type {AlertVariants} from "@ropav/styles";
