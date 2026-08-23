import type {DisclosureKey} from "../../composables/use-disclosure-group";
import type {AccordionVariants} from "@ropav/styles";

export interface AccordionRootProps {
  class?: string;
  /** Whether more than one item can be expanded at a time. */
  allowsMultipleExpanded?: boolean;
  /** Expanded item keys in uncontrolled mode. */
  defaultExpandedKeys?: Iterable<DisclosureKey>;
  /** Expanded item keys in controlled mode. Pairs with `v-model:expanded-keys`. */
  expandedKeys?: Iterable<DisclosureKey>;
  /** Removes the separator drawn between items. @default false */
  hideSeparator?: boolean;
  /** Disables every item in the accordion. */
  isDisabled?: boolean;
  /** Visual variant. */
  variant?: AccordionVariants["variant"];
}

export interface AccordionItemProps {
  class?: string;
  /**
   * Identity of the item within the group, and the value carried in `expandedKeys`.
   * Generated when omitted.
   */
  id?: string;
  /** Disables this item only. */
  isDisabled?: boolean;
}

export interface AccordionHeadingProps {
  class?: string;
}

export interface AccordionTriggerProps {
  class?: string;
}

export interface AccordionPanelProps {
  class?: string;
  /**
   * ARIA role of the panel. Matches React Aria's default.
   * @default "group"
   */
  role?: string;
}

export interface AccordionIndicatorProps {
  class?: string;
}

export interface AccordionBodyProps {
  class?: string;
}
