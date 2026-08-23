import type { SurfaceVariants } from "@ropav/styles";

export interface SurfaceRootProps {
  class?: string;
  /** Visual variant. @default "default" */
  variant?: SurfaceVariants["variant"];
}
