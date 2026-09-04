import type { LinkProps } from "../link";

export type BreadcrumbKey = string | number;

export interface BreadcrumbsRootProps {
  class?: string;
  /** Disables every breadcrumb link. */
  isDisabled?: boolean;
  /** Accessible name for the list. Defaults to the localized word “Breadcrumbs”. */
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** A component rendered between items. Plain text is rendered without a wrapper. */
  separator?: unknown;
}

export interface BreadcrumbsItemProps extends Omit<LinkProps, "class" | "ariaCurrent"> {
  class?: string;
  /** Key reported by the root's `action` event. A stable id is generated when omitted. */
  id?: BreadcrumbKey;
}

export interface BreadcrumbsItemSlotProps {
  isCurrent: boolean;
  isDisabled: boolean;
}
