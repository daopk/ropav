import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dropZoneVariants = tv({
  slots: {
    base: "rp-drop-zone",
    trigger: "rp-drop-zone__trigger",
  },
});

export type DropZoneVariants = VariantProps<typeof dropZoneVariants>;
