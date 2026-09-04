import DisclosureBody from "./disclosure-body.vue";
import DisclosureContent from "./disclosure-content.vue";
import DisclosureHeading from "./disclosure-heading.vue";
import DisclosureIndicator from "./disclosure-indicator.vue";
import DisclosureRoot from "./disclosure-root.vue";
import DisclosureTrigger from "./disclosure-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DisclosureRoot as Disclosure,
  DisclosureHeading,
  DisclosureTrigger,
  DisclosureContent,
  DisclosureBody,
  DisclosureIndicator,
};

export type {
  DisclosureRootProps as DisclosureProps,
  DisclosureHeadingProps,
  DisclosureTriggerProps,
  DisclosureContentProps,
  DisclosureBodyProps,
  DisclosureIndicatorProps,
} from "./disclosure.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useDisclosureContext } from "./disclosure.context";

export type { DisclosureContext } from "./disclosure.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { disclosureVariants } from "@ropav/styles";

export type { DisclosureVariants } from "@ropav/styles";
