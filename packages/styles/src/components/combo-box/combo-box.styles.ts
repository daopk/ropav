import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const comboBoxVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
  },
  slots: {
    base: "combo-box",
    inputGroup: "combo-box__input-group",
    popover: "combo-box__popover",
    trigger: "combo-box__trigger",
    value: "combo-box__value",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "combo-box--full-width",
        inputGroup: "combo-box__input-group--full-width",
      },
    },
    /* The field itself is the `Input` inside, which takes its own size class from the context the
     * root provides. Only the popover is left, and it is teleported out of this tree. */
    size: {
      lg: {
        popover: "combo-box__popover--lg",
      },
      md: {},
      sm: {
        popover: "combo-box__popover--sm",
      },
    },
  },
});

export type ComboBoxVariants = VariantProps<typeof comboBoxVariants>;
