import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const typographyVariants = tv({
  defaultVariants: {
    align: "start",
    color: "default",
    type: "body",
  },
  slots: {
    base: "rp-typography",
    prose: "rp-typography-prose",
  },
  variants: {
    align: {
      center: "rp-typography--align-center",
      end: "rp-typography--align-end",
      justify: "rp-typography--align-justify",
      start: "rp-typography--align-start",
    },
    color: {
      default: "rp-typography--color-default",
      muted: "rp-typography--color-muted",
    },
    truncate: {
      true: "rp-typography--truncate",
    },
    type: {
      body: "rp-typography--body",
      "body-sm": "rp-typography--body-sm",
      "body-xs": "rp-typography--body-xs",
      code: "rp-typography--code",
      h1: "rp-typography--h1",
      h2: "rp-typography--h2",
      h3: "rp-typography--h3",
      h4: "rp-typography--h4",
      h5: "rp-typography--h5",
      h6: "rp-typography--h6",
    },
    weight: {
      bold: "rp-typography--weight-bold",
      medium: "rp-typography--weight-medium",
      normal: "rp-typography--weight-normal",
      semibold: "rp-typography--weight-semibold",
    },
  },
});

export type TypographyVariants = VariantProps<typeof typographyVariants>;
