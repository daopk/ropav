import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const dropZoneVariants = tv({
  slots: {
    base: "drop-zone",
    trigger: "drop-zone__trigger",
  },
});

export type DropZoneVariants = VariantProps<typeof dropZoneVariants>;
