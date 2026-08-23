import type { SurfaceVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SurfaceContext {
  /** The surface a descendant is sitting on, so it can pick an "on-surface" colour. */
  variant: ComputedRef<SurfaceVariants["variant"]>;
}

/**
 * Loose on purpose: components read this to adapt to the surface behind them, but they all
 * render fine on the page background. Having no surface above is the normal case.
 */
export const [useSurfaceContext, provideSurfaceContext] = createContext<SurfaceContext | null>({
  defaultValue: null,
  name: "SurfaceContext",
  strict: false,
});
