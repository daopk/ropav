import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dropZoneVariants = tv({
  slots: {
    base: "drop-zone",
    trigger: "drop-zone__trigger",
  },
});

export type DropZoneVariants = VariantProps<typeof dropZoneVariants>;
