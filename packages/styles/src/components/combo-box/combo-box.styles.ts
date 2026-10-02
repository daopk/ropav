import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const comboBoxVariants = tv({
  defaultVariants: {
    fullWidth: false,
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
  },
});

export type ComboBoxVariants = VariantProps<typeof comboBoxVariants>;
