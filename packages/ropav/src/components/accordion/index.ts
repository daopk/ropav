import AccordionBody from "./accordion-body.vue";
import AccordionHeading from "./accordion-heading.vue";
import AccordionIndicator from "./accordion-indicator.vue";
import AccordionItem from "./accordion-item.vue";
import AccordionPanel from "./accordion-panel.vue";
import AccordionRoot from "./accordion-root.vue";
import AccordionTrigger from "./accordion-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AccordionRoot as Accordion,
  AccordionItem,
  AccordionHeading,
  AccordionTrigger,
  AccordionPanel,
  AccordionIndicator,
  AccordionBody,
};

export type {
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
export { accordionVariants } from "@ropav/styles";

export type { AccordionVariants } from "@ropav/styles";
