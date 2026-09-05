import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const tabsVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "rp-tabs",
    scrollNext: "rp-tabs__list-container__scroll-next",
    scrollPrev: "rp-tabs__list-container__scroll-prev",
    scroller: "rp-tabs__list-container__scroller",
    separator: "rp-tabs__separator",
    tab: "rp-tabs__tab",
    tabIndicator: "rp-tabs__indicator",
    tabList: "rp-tabs__list",
    tabListContainer: "rp-tabs__list-container",
    tabPanel: "rp-tabs__panel",
  },
  variants: {
    variant: {
      primary: {},
      secondary: {
        base: "rp-tabs--secondary",
      },
    },
  },
});

// Render props that should be excluded from TabsVariants (framework-specific)
type TabsRenderPropsKeys = "selectedKey";

export type TabsVariants = Omit<VariantProps<typeof tabsVariants>, TabsRenderPropsKeys>;
