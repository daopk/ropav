import type { DateSegment } from "../../composables/use-date-field-state";
import type { DateInputGroupVariants } from "@ropav/styles";

/*
 * Boolean props are declared as plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<X full-width>` would arrive as `""`
 * and read as falsy, so the modifier silently never applies.
 */
export interface DateInputGroupRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: DateInputGroupVariants["variant"];
  /** Whether the group stretches to fill its container. */
  fullWidth?: boolean;
  /** Whether the group reads as disabled. Taken from the field it sits in when unset. */
  isDisabled?: boolean;
  /** Whether the group reads as invalid. Taken from the field it sits in when unset. */
  isInvalid?: boolean;
  /** Whether the group reads as read-only. Taken from the field it sits in when unset. */
  isReadOnly?: boolean;
}

/** State the group hands to its slot, matching React's group render props. */
export interface DateInputGroupRootSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface DateInputGroupInputProps {
  class?: string;
  /**
   * Which end of a range this edits, for an input inside a range picker.
   *
   * A range picker owns two fields and renders neither, so the markup is what says which one a
   * given row of segments belongs to. Left unset by a field that owns a single value.
   */
  slot?: "start" | "end";
}

/** One segment per slot call, in the order the locale writes them. */
export interface DateInputGroupInputSlotProps {
  segment: DateSegment;
}

export interface DateInputGroupSegmentProps {
  class?: string;
  /** The part of the date this renders, taken from the input's slot. */
  segment: DateSegment;
}

export interface DateInputGroupInputContainerProps {
  class?: string;
}

export interface DateInputGroupPrefixProps {
  class?: string;
}

export interface DateInputGroupSuffixProps {
  class?: string;
}
