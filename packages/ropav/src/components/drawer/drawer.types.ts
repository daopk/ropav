import type { OverlayTriggerState } from "../../composables/use-overlay-trigger-state";
import type { DrawerVariants } from "@ropav/styles";
import type { CSSProperties } from "vue";

/** Which edge the drawer slides in from. */
export type DrawerPlacement = "top" | "bottom" | "left" | "right";

export interface DrawerRootProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  /**
   * An open state held outside the drawer, for a caller driving several overlays from one place.
   *
   * Equivalent to passing `isOpen` and listening to `openChange`, and takes precedence over both.
   */
  state?: OverlayTriggerState;
}

export interface DrawerRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface DrawerTriggerProps {
  class?: string;
  isDisabled?: boolean;
}

export interface DrawerBackdropProps {
  class?: string;
  /** How the page behind the drawer is treated. @default "opaque" */
  variant?: DrawerVariants["variant"];
  /** Whether an interaction outside the drawer closes it, and whether it can be dragged away. */
  isDismissable?: boolean;
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
  /** Filters which outside elements dismiss the drawer. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Where the drawer is rendered. @default document.body */
  portalContainer?: string | HTMLElement;
  /**
   * Inline style for the backdrop.
   *
   * Declared rather than left to fallthrough because the viewport custom properties are merged
   * over it: the stylesheet sizes the drawer from them, and a caller's own style winning would
   * leave it with no height at all.
   */
  style?: CSSProperties | string;
  /** Forces the entry state on both elements, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state on both elements. */
  isExiting?: boolean;
}

export interface DrawerContentProps {
  class?: string;
  /** @default "bottom" */
  placement?: DrawerPlacement;
}

export interface DrawerDialogProps {
  class?: string;
}

export interface DrawerDialogSlotProps {
  /** Closes the drawer, for a control inside it that is not a `DrawerClose`. */
  close: () => void;
}

export interface DrawerHeaderProps {
  class?: string;
}

export interface DrawerHeadingProps {
  class?: string;
  /** Heading level. @default 2 */
  level?: number;
}

export interface DrawerBodyProps {
  class?: string;
}

export interface DrawerFooterProps {
  class?: string;
}

export interface DrawerHandleProps {
  class?: string;
}

export interface DrawerCloseTriggerProps {
  class?: string;
}
