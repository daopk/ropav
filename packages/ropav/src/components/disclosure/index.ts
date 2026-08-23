import DisclosureBody from "./disclosure-body.vue";
import DisclosureContent from "./disclosure-content.vue";
import DisclosureHeading from "./disclosure-heading.vue";
import DisclosureIndicator from "./disclosure-indicator.vue";
import DisclosureRoot from "./disclosure-root.vue";
import DisclosureTrigger from "./disclosure-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a disclosure, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Disclosure = Object.assign(DisclosureRoot, {
  Root: DisclosureRoot,
  Heading: DisclosureHeading,
  Trigger: DisclosureTrigger,
  Content: DisclosureContent,
  Body: DisclosureBody,
  Indicator: DisclosureIndicator,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

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
export {useDisclosureContext} from "./disclosure.context";

export type {DisclosureContext} from "./disclosure.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {disclosureVariants} from "@ropav/styles";

export type {DisclosureVariants} from "@ropav/styles";
