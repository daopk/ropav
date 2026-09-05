import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const disclosureVariants = tv({
  defaultVariants: {},
  slots: {
    base: "rp-disclosure",
    body: "rp-disclosure__body",
    bodyInner: "rp-disclosure__body-inner",
    content: "rp-disclosure__content",
    heading: "rp-disclosure__heading",
    indicator: "rp-disclosure__indicator",
    trigger: "rp-disclosure__trigger",
  },
  variants: {},
});

// Render props that should be excluded from DisclosureVariants (framework-specific)
type DisclosureRenderPropsKeys = "isExpanded" | "isDisabled" | "state";

export type DisclosureVariants = Omit<
  VariantProps<typeof disclosureVariants>,
  DisclosureRenderPropsKeys
>;
