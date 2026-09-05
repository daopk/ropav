import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const menuItemVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    indicator: "rp-menu-item__indicator",
    item: "rp-menu-item",
    submenuIndicator: "rp-menu-item__indicator rp-menu-item__indicator--submenu",
  },
  variants: {
    variant: {
      danger: {
        item: "rp-menu-item--danger",
      },
      default: {
        item: "rp-menu-item--default",
      },
    },
  },
});

export type MenuItemVariants = VariantProps<typeof menuItemVariants>;
