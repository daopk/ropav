import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

/*
 * Orientation is carried as a modifier class rather than left to a `[data-orientation]` selector
 * in the stylesheet: a splitter nests, and a descendant selector on the root would reach an inner
 * group's handle as well as its own. Only `base` and `handle` branch, because only they have
 * orientation-specific rules — a modifier on the others would be dead CSS.
 */
export const splitterVariants = tv({
  defaultVariants: {
    orientation: "horizontal",
  },
  slots: {
    base: "splitter",
    handle: "splitter__handle",
    handleGrip: "splitter__handle-grip",
    panel: "splitter__panel",
  },
  variants: {
    orientation: {
      horizontal: {
        base: "splitter--horizontal",
        handle: "splitter__handle--horizontal",
      },
      vertical: {
        base: "splitter--vertical",
        handle: "splitter__handle--vertical",
      },
    },
  },
});

export type SplitterVariants = VariantProps<typeof splitterVariants>;
