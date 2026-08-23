import type { ScrollShadowVariants } from "@ropav/styles";
import type { StyleValue } from "vue";

export type ScrollShadowVisibility = "auto" | "both" | "top" | "bottom" | "left" | "right" | "none";

export interface ScrollShadowRootProps {
  class?: string;
  style?: StyleValue;
  hideScrollBar?: boolean;
  /** Whether automatic overflow detection is enabled. @default true */
  isEnabled?: boolean;
  /** Scroll distance before a shadow appears, in pixels. @default 0 */
  offset?: number;
  /** Scroll axis. @default "vertical" */
  orientation?: ScrollShadowVariants["orientation"];
  /** Size of the fade, in pixels. @default 40 */
  size?: number;
  /** Visual treatment. @default "fade" */
  variant?: ScrollShadowVariants["variant"];
  /** Automatic or controlled shadow visibility. @default "auto" */
  visibility?: ScrollShadowVisibility;
  /** Called when automatic detection reaches a different visibility state. */
  onVisibilityChange?: (visibility: ScrollShadowVisibility) => void;
}
