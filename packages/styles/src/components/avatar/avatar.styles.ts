import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const avatarVariants = tv({
  defaultVariants: {
    color: "default",
    size: "md",
  },
  slots: {
    base: "rp-avatar",
    fallback: "rp-avatar__fallback",
    image: "rp-avatar__image",
  },
  variants: {
    color: {
      accent: {
        fallback: "rp-avatar__fallback--accent",
      },
      danger: {
        fallback: "rp-avatar__fallback--danger",
      },
      default: {
        fallback: "rp-avatar__fallback--default",
      },
      success: {
        fallback: "rp-avatar__fallback--success",
      },
      warning: {
        fallback: "rp-avatar__fallback--warning",
      },
    },
    size: {
      lg: {
        base: "rp-avatar--lg",
      },
      md: {
        base: "rp-avatar--md",
      },
      sm: {
        base: "rp-avatar--sm",
      },
    },
    variant: {
      default: {},
      soft: {
        base: "rp-avatar--soft",
      },
    },
  },
});

export type AvatarVariants = VariantProps<typeof avatarVariants>;
