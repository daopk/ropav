import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const radioVariants = tv({
  slots: {
    base: "rp-radio",
    content: "rp-radio__content",
    control: "rp-radio__control",
    indicator: "rp-radio__indicator",
  },
});

export type RadioVariants = VariantProps<typeof radioVariants>;
