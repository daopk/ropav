import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

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
    variant: "sidebar",
  },
  slots: {
    base: "rp-sidebar",
    content: "rp-sidebar__content",
    footer: "rp-sidebar__footer",
    group: "rp-sidebar__group",
    groupLabel: "rp-sidebar__group-label",
    header: "rp-sidebar__header",
    inset: "rp-sidebar__inset",
    item: "rp-sidebar__item",
    itemIcon: "rp-sidebar__item-icon",
    itemIndicator: "rp-sidebar__item-indicator",
    itemLabel: "rp-sidebar__item-label",
    itemTooltip: "rp-sidebar__item-tooltip",
    itemTrailing: "rp-sidebar__item-trailing",
    panel: "rp-sidebar__panel",
    rail: "rp-sidebar__rail",
    railTarget: "rp-sidebar__rail-target",
    separator: "rp-sidebar__separator",
    subMenu: "rp-sidebar__sub-menu",
    trigger: "rp-sidebar__trigger",
  },
  variants: {
    collapsible: {
      icon: {
        panel: "rp-sidebar__panel--icon",
      },
      none: {
        panel: "rp-sidebar__panel--none",
      },
      offcanvas: {
        panel: "rp-sidebar__panel--offcanvas",
      },
    },
    // Whether the panel is rendering inside a drawer. Resolved by the panel at call time rather
    // than by the root, because it is the one part that changes shape when the viewport narrows.
    inDrawer: {
      true: {
        panel: "rp-sidebar__panel--drawer",
      },
    },
    // Whether this submenu folds. Resolved by the submenu at call time rather than by the root,
    // because one sidebar holds items that fold and items that do not.
    isCollapsible: {
      true: {
        subMenu: "rp-sidebar__sub-menu--collapsible",
      },
    },
    // Whether the rail resizes rather than only toggling. Not folded into `collapsible`, because
    // the two are independent: a sidebar that cannot collapse at all can still be dragged wider.
    isResizable: {
      true: {
        rail: "rp-sidebar__rail--resizable",
      },
    },
    // Whether the row is a child under another item. Resolved by the item at call time, from the
    // submenu it finds itself inside rather than from a prop a caller has to remember on every row.
    isSub: {
      true: {
        item: "rp-sidebar__item--sub",
      },
    },
    side: {
      left: {
        base: "rp-sidebar--left",
        panel: "rp-sidebar__panel--left",
      },
      right: {
        base: "rp-sidebar--right",
        panel: "rp-sidebar__panel--right",
      },
    },
    /*
     * How much chrome the shell paints. Each slot's modifier is named for what that slot does
     * rather than for the value, the way `inDrawer` becomes `--drawer` and `isSub` becomes
     * `--sub`: `inset` is already a slot, so echoing the value would read `sidebar__inset--inset`,
     * and `sidebar__panel--inset` would be false besides — under it the panel is the bare one and
     * the inset is the card.
     *
     * `sidebar` emits nothing, because the base rules already are that look. A modifier saying so
     * would be an empty rule restating the block above it.
     */
    variant: {
      floating: {
        panel: "rp-sidebar__panel--floating",
        rail: "rp-sidebar__rail--quiet",
      },
      inset: {
        inset: "rp-sidebar__inset--card",
        panel: "rp-sidebar__panel--bare",
        rail: "rp-sidebar__rail--quiet",
      },
      sidebar: {},
    },
  },
});

export type SidebarVariants = VariantProps<typeof sidebarVariants>;
