import AccordionBody from "./accordion-body.vue";
import AccordionHeading from "./accordion-heading.vue";
import AccordionIndicator from "./accordion-indicator.vue";
import AccordionItem from "./accordion-item.vue";
import AccordionPanel from "./accordion-panel.vue";
import AccordionRoot from "./accordion-root.vue";
import AccordionTrigger from "./accordion-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of an accordion, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Accordion = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Heading: AccordionHeading,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
  Indicator: AccordionIndicator,
  Body: AccordionBody,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AccordionRoot,
  AccordionItem,
  AccordionHeading,
  AccordionTrigger,
  AccordionPanel,
  AccordionIndicator,
  AccordionBody,
};

export type {
  AccordionRootProps,
  AccordionRootProps as AccordionProps,
  AccordionItemProps,
  AccordionHeadingProps,
  AccordionTriggerProps,
  AccordionPanelProps,
  AccordionIndicatorProps,
  AccordionBodyProps,
} from "./accordion.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {accordionVariants} from "@heroui/styles";

export type {AccordionVariants} from "@heroui/styles";
