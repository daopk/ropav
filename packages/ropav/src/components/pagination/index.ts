import PaginationContent from "./pagination-content.vue";
import PaginationEllipsis from "./pagination-ellipsis.vue";
import PaginationItem from "./pagination-item.vue";
import PaginationLink from "./pagination-link.vue";
import PaginationNextIcon from "./pagination-next-icon.vue";
import PaginationNext from "./pagination-next.vue";
import PaginationPreviousIcon from "./pagination-previous-icon.vue";
import PaginationPrevious from "./pagination-previous.vue";
import PaginationRoot from "./pagination-root.vue";
import PaginationSummary from "./pagination-summary.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a pagination bar, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Pagination = Object.assign(PaginationRoot, {
  Root: PaginationRoot,
  Summary: PaginationSummary,
  Content: PaginationContent,
  Item: PaginationItem,
  Link: PaginationLink,
  Previous: PaginationPrevious,
  PreviousIcon: PaginationPreviousIcon,
  Next: PaginationNext,
  NextIcon: PaginationNextIcon,
  Ellipsis: PaginationEllipsis,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PaginationRoot,
  PaginationSummary,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationNext,
  PaginationNextIcon,
  PaginationEllipsis,
};

export type {
  PaginationRootProps,
  PaginationRootProps as PaginationProps,
  PaginationSummaryProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationLinkSlotProps,
  PaginationPreviousProps,
  PaginationPreviousIconProps,
  PaginationNextProps,
  PaginationNextIconProps,
  PaginationEllipsisProps,
} from "./pagination.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {paginationVariants} from "@ropav/styles";

export type {PaginationVariants} from "@ropav/styles";
