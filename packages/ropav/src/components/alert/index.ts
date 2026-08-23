import AlertContent from "./alert-content.vue";
import AlertDescription from "./alert-description.vue";
import AlertIndicator from "./alert-indicator.vue";
import AlertRoot from "./alert-root.vue";
import AlertTitle from "./alert-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Alert = Object.assign(AlertRoot, {
  Content: AlertContent,
  Description: AlertDescription,
  Indicator: AlertIndicator,
  Root: AlertRoot,
  Title: AlertTitle,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle };

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
export { alertVariants } from "@ropav/styles";

export type { AlertVariants } from "@ropav/styles";
