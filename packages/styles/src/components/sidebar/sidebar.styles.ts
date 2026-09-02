import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

/*
 * Side and collapse mode are carried as modifier classes rather than left to `[data-side]` /
 * `[data-collapsible]` selectors in the stylesheet, the same call `splitterVariants` makes: a
 * selector descending from the shell would reach a second sidebar rendered inside the inset — a
 * settings pane with a nav of its own — and lay its border down the outer one's edge.
 *
 * Only the slots with side- or mode-specific rules branch. `data-collapsed` is deliberately not a
 * variant: it flips while you watch, which is what a state key is for, and a modifier saying so
 * would have to be recomputed on every toggle.
 */
export const sidebarVariants = tv({
  defaultVariants: {
    collapsible: "icon",
    side: "left",
  },
  slots: {
    base: "sidebar",
    content: "sidebar__content",
    footer: "sidebar__footer",
    group: "sidebar__group",
    groupLabel: "sidebar__group-label",
    header: "sidebar__header",
    inset: "sidebar__inset",
    item: "sidebar__item",
    itemIcon: "sidebar__item-icon",
    itemLabel: "sidebar__item-label",
    itemTrailing: "sidebar__item-trailing",
    panel: "sidebar__panel",
    rail: "sidebar__rail",
    railTarget: "sidebar__rail-target",
    separator: "sidebar__separator",
    trigger: "sidebar__trigger",
  },
  variants: {
    collapsible: {
      icon: {
        panel: "sidebar__panel--icon",
      },
      none: {
        panel: "sidebar__panel--none",
      },
      offcanvas: {
        panel: "sidebar__panel--offcanvas",
      },
    },
    // Whether the panel is rendering inside a drawer. Resolved by the panel at call time rather
    // than by the root, because it is the one part that changes shape when the viewport narrows.
    inDrawer: {
      true: {
        panel: "sidebar__panel--drawer",
      },
    },
    // Whether the rail resizes rather than only toggling. Not folded into `collapsible`, because
    // the two are independent: a sidebar that cannot collapse at all can still be dragged wider.
    isResizable: {
      true: {
        rail: "sidebar__rail--resizable",
      },
    },
    side: {
      left: {
        base: "sidebar--left",
        panel: "sidebar__panel--left",
      },
      right: {
        base: "sidebar--right",
        panel: "sidebar__panel--right",
      },
    },
  },
});

export type SidebarVariants = VariantProps<typeof sidebarVariants>;
