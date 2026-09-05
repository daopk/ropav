import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const fieldsetVariants = tv({
  slots: {
    actions: "rp-fieldset__actions",
    base: "rp-fieldset",
    description: "rp-fieldset__description",
    fieldGroup: "rp-fieldset__field_group",
    legend: "rp-fieldset__legend",
  },
});

export type FieldsetVariants = VariantProps<typeof fieldsetVariants>;
