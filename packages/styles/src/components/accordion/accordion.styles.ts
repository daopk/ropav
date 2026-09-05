import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const accordionVariants = tv({
  slots: {
    base: "rp-accordion",
    body: "rp-accordion__body",
    bodyInner: "rp-accordion__body-inner",
    heading: "rp-accordion__heading",
    indicator: "rp-accordion__indicator",
    item: "rp-accordion__item",
    panel: "rp-accordion__panel",
    trigger: "rp-accordion__trigger",
  },
  variants: {
    variant: {
      default: {},
      surface: {
        base: "rp-accordion--surface",
      },
    },
  },
});

// Render props that should be excluded from AccordionVariants (framework-specific)
type DisclosureRenderPropsKeys = "isExpanded" | "isDisabled" | "state";

export type AccordionVariants = Omit<
  VariantProps<typeof accordionVariants>,
  DisclosureRenderPropsKeys
>;
