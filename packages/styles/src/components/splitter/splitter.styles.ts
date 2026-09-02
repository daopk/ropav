import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

/*
 * Orientation is carried as a modifier class rather than left to a `[data-orientation]` selector
 * in the stylesheet: a splitter nests, and a descendant selector on the root would reach an inner
 * group's handle as well as its own. Only `base`, `handle` and `handleGrip` branch, because only
 * they have orientation-specific rules — a modifier on the others would be dead CSS.
 *
 * `handleGrip` branches here rather than being sized from its parent's modifier, and that buys two
 * things at once: the root already resolves these slots against the orientation, so a handle needs
 * no extra wiring to size its grip, and the grip carries a `--` class of its own — which is what
 * puts it in front of the Storybook forced-colors sweep. `showGrip` is deliberately *not* a variant:
 * the grip is only rendered when it is asked for, so a modifier saying so would be dead CSS.
 */
export const splitterVariants = tv({
  defaultVariants: {
    orientation: "horizontal",
  },
  slots: {
    base: "splitter",
    handle: "splitter__handle",
    handleGrip: "splitter__handle-grip",
    handleTarget: "splitter__handle-target",
    panel: "splitter__panel",
  },
  variants: {
    orientation: {
      horizontal: {
        base: "splitter--horizontal",
        handle: "splitter__handle--horizontal",
        handleGrip: "splitter__handle-grip--horizontal",
      },
      vertical: {
        base: "splitter--vertical",
        handle: "splitter__handle--vertical",
        handleGrip: "splitter__handle-grip--vertical",
      },
    },
  },
});

export type SplitterVariants = VariantProps<typeof splitterVariants>;
