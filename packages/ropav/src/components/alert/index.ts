import AlertContent from "./alert-content.vue";
import AlertDescription from "./alert-description.vue";
import AlertIndicator from "./alert-indicator.vue";
import AlertRoot from "./alert-root.vue";
import AlertTitle from "./alert-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { AlertContent, AlertDescription, AlertIndicator, AlertRoot as Alert, AlertTitle };

export type {
  AlertContentProps,
  AlertDescriptionProps,
  AlertIndicatorProps,
  AlertRootProps as AlertProps,
  AlertTitleProps,
} from "./alert.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { alertVariants } from "@ropav/styles";

export type { AlertVariants } from "@ropav/styles";
