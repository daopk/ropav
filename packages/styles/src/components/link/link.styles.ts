import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const linkVariants = tv({
  slots: {
    base: "rp-link",
    icon: "rp-link__icon",
  },
});

// Render props that should be excluded from LinkVariants (framework-specific)
type LinkRenderPropsKeys =
  | "isCurrent"
  | "isHovered"
  | "isPressed"
  | "isFocused"
  | "isFocusVisible"
  | "isDisabled";

export type LinkVariants = Omit<VariantProps<typeof linkVariants>, LinkRenderPropsKeys>;
