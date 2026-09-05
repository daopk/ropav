import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const tableVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "rp-table-root",
    body: "rp-table__body",
    cell: "rp-table__cell",
    column: "rp-table__column",
    columnResizer: "rp-table__column-resizer",
    content: "rp-table__content",
    /** Named but unstyled: the hook a caller's own rule attaches to. */
    dropIndicator: "rp-table__drop-indicator",
    footer: "rp-table__footer",
    header: "rp-table__header",
    loadMore: "rp-table__load-more",
    loadMoreContent: "rp-table__load-more-content",
    resizableContainer: "rp-table__resizable-container",
    row: "rp-table__row",
    scrollContainer: "rp-table__scroll-container",
    sortableColumnHeader: "rp-table__sortable-column-header",
    sortableColumnIndicator: "rp-table__sortable-column-indicator",
  },
  variants: {
    variant: {
      primary: {
        base: "rp-table-root--primary",
      },
      secondary: {
        base: "rp-table-root--secondary",
      },
    },
  },
});

// Exclude React Aria render prop keys from the variant types
type TableRenderPropsKeys =
  | "isHovered"
  | "isFocused"
  | "isFocusVisible"
  | "isSelected"
  | "isDisabled"
  | "isDragging"
  | "isDropTarget"
  | "state";

export type TableVariants = Omit<VariantProps<typeof tableVariants>, TableRenderPropsKeys>;
