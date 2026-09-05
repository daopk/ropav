import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dropdownVariants = tv({
  slots: {
    // The block is shared with the standalone menu; `dropdown__menu` is only the hook that
    // `dropdown.css` and callers target.
    menu: "rp-menu rp-dropdown__menu",
    popover: "rp-dropdown__popover",
    root: "rp-dropdown",
    trigger: "rp-dropdown__trigger",
  },
});

export type DropdownVariants = VariantProps<typeof dropdownVariants>;
