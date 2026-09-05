import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const comboBoxVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
  },
  slots: {
    base: "rp-combo-box",
    inputGroup: "rp-combo-box__input-group",
    popover: "rp-combo-box__popover",
    trigger: "rp-combo-box__trigger",
    value: "rp-combo-box__value",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-combo-box--full-width",
        inputGroup: "rp-combo-box__input-group--full-width",
      },
    },
    /* The field itself is the `Input` inside, which takes its own size class from the context the
     * root provides. Only the popover is left, and it is teleported out of this tree. */
    size: {
      lg: {
        popover: "rp-combo-box__popover--lg",
      },
      md: {},
      sm: {
        popover: "rp-combo-box__popover--sm",
      },
    },
  },
});

export type ComboBoxVariants = VariantProps<typeof comboBoxVariants>;
