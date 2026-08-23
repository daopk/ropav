export interface DisclosureRootProps {
  class?: string;
  /** Expanded in uncontrolled mode. */
  defaultExpanded?: boolean;
  /**
   * Identity of the disclosure within a group, and the value carried in the group's
   * `expandedKeys`. Generated when omitted.
   */
  id?: string;
  /** Disables the disclosure, and its trigger with it. */
  isDisabled?: boolean;
  /** Expanded in controlled mode. Pairs with `v-model:is-expanded`. */
  isExpanded?: boolean;
}

export interface DisclosureHeadingProps {
  class?: string;
}

export interface DisclosureTriggerProps {
  class?: string;
}

export interface DisclosureContentProps {
  class?: string;
  /**
   * ARIA role of the panel. Matches React Aria's default.
   * @default "group"
   */
  role?: string;
}

export interface DisclosureBodyProps {
  class?: string;
}

export interface DisclosureIndicatorProps {
  class?: string;
}
