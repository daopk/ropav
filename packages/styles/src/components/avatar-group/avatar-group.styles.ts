import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const avatarGroupVariants = tv({
  defaultVariants: {
    front: "last",
    orientation: "horizontal",
    overlap: "md",
    size: "md",
  },
  slots: {
    base: "rp-avatar-group",
    overflow: "rp-avatar-group__overflow",
  },
  variants: {
    front: {
      // Nothing to emit: painting later siblings over earlier ones is what the document order
      // already does, so the default direction costs no rule and no stacking context.
      first: {
        base: "rp-avatar-group--front-first",
      },
      last: {},
    },
    orientation: {
      horizontal: {
        base: "rp-avatar-group--horizontal",
      },
      vertical: {
        base: "rp-avatar-group--vertical",
      },
    },
    overlap: {
      lg: {
        base: "rp-avatar-group--overlap-lg",
      },
      md: {
        base: "rp-avatar-group--overlap-md",
      },
      none: {
        base: "rp-avatar-group--overlap-none",
      },
      sm: {
        base: "rp-avatar-group--overlap-sm",
      },
    },
    size: {
      lg: {
        base: "rp-avatar-group--lg",
      },
      md: {
        base: "rp-avatar-group--md",
      },
      sm: {
        base: "rp-avatar-group--sm",
      },
    },
  },
});

export type AvatarGroupVariants = VariantProps<typeof avatarGroupVariants>;
