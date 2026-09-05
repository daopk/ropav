import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const inputOTPVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "rp-input-otp",
    caret: "rp-input-otp__caret",
    group: "rp-input-otp__group",
    input: "rp-input-otp__input",
    separator: "rp-input-otp__separator",
    slot: "rp-input-otp__slot",
    slotValue: "rp-input-otp__slot-value",
  },
  variants: {
    variant: {
      primary: {
        base: "rp-input-otp--primary",
      },
      secondary: {
        base: "rp-input-otp--secondary",
      },
    },
  },
});

export type InputOTPVariants = VariantProps<typeof inputOTPVariants>;
