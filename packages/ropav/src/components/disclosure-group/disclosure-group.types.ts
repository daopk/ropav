import type { DisclosureKey } from "../../composables/use-disclosure-group";

export interface DisclosureGroupRootProps {
  class?: string;
  /** Whether more than one disclosure can be expanded at a time. */
  allowsMultipleExpanded?: boolean;
  /** Expanded disclosure keys in uncontrolled mode. */
  defaultExpandedKeys?: Iterable<DisclosureKey>;
  /** Expanded disclosure keys in controlled mode. Pairs with `v-model:expanded-keys`. */
  expandedKeys?: Iterable<DisclosureKey>;
  /** Disables every disclosure in the group. */
  isDisabled?: boolean;
}
