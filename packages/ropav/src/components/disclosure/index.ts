import DisclosureBody from "./disclosure-body.vue";
import DisclosureContent from "./disclosure-content.vue";
import DisclosureHeading from "./disclosure-heading.vue";
import DisclosureIndicator from "./disclosure-indicator.vue";
import DisclosureRoot from "./disclosure-root.vue";
import DisclosureTrigger from "./disclosure-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Disclosure = Object.assign(DisclosureRoot, {
  Body: DisclosureBody,
  Content: DisclosureContent,
  Heading: DisclosureHeading,
  Indicator: DisclosureIndicator,
  Root: DisclosureRoot,
  Trigger: DisclosureTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DisclosureRoot,
  DisclosureHeading,
  DisclosureTrigger,
  DisclosureContent,
  DisclosureBody,
  DisclosureIndicator,
};

export type {
  DisclosureRootProps,
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
