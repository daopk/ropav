import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dropdownVariants = tv({
  slots: {
    // The block is shared with the standalone menu; `dropdown__menu` is only the hook that
    // `dropdown.css` and callers target.
    menu: "menu dropdown__menu",
    popover: "dropdown__popover",
    root: "dropdown",
    trigger: "dropdown__trigger",
  },
});

export type DropdownVariants = VariantProps<typeof dropdownVariants>;
