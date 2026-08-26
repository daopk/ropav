import type { PaginationVariants } from "@ropav/styles";

export interface PaginationRootProps {
  /**
   * Name for the navigation landmark.
   *
   * Overridable because the name is what tells two paginations apart: a list with one set of
   * controls above it and another below reports the same landmark twice otherwise.
   * @default "pagination"
   */
  ariaLabel?: string;
  class?: string;
  /** Pagination size. @default "md" */
  size?: PaginationVariants["size"];
}

export interface PaginationSummaryProps {
  class?: string;
}

export interface PaginationContentProps {
  class?: string;
}

export interface PaginationItemProps {
  class?: string;
}

export interface PaginationLinkProps {
  class?: string;
  /** Disables the control. */
  isDisabled?: boolean;
  /** Marks the page this link points at as the one being viewed. */
  isActive?: boolean;
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
}

export interface PaginationPreviousProps {
  class?: string;
  /** Disables the control. */
  isDisabled?: boolean;
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
}

export interface PaginationNextProps {
  class?: string;
  /** Disables the control. */
  isDisabled?: boolean;
  /** Native button type. @default "button" */
  type?: "button" | "reset" | "submit";
}

export interface PaginationPreviousIconProps {
  class?: string;
}

export interface PaginationNextIconProps {
  class?: string;
}

export interface PaginationEllipsisProps {
  class?: string;
}

/** State handed to the default slot of a pagination control. */
export interface PaginationLinkSlotProps {
  isDisabled: boolean;
  isFocusVisible: boolean;
  isHovered: boolean;
  isPressed: boolean;
}
