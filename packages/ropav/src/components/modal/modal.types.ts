import type { OverlayTriggerState } from "../../composables/use-overlay-trigger-state";
import type { ModalVariants } from "@ropav/styles";
import type { CSSProperties } from "vue";

/** Where the dialog sits in the container. `auto` is bottom on a phone and centred above it. */
export type ModalPlacement = "auto" | "top" | "center" | "bottom";

export interface ModalRootProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  /**
   * An open state held outside the modal, for a caller driving several overlays from one place.
   *
   * Equivalent to passing `isOpen` and listening to `openChange`, and takes precedence over both.
   */
  state?: OverlayTriggerState;
}

export interface ModalRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface ModalTriggerProps {
  class?: string;
}

export interface ModalBackdropProps {
  class?: string;
  /** How the page behind the modal is treated. @default "opaque" */
  variant?: ModalVariants["variant"];
  /** Whether an interaction outside the dialog closes the modal. @default true */
  isDismissable?: boolean;
  /** @default false */
  isKeyboardDismissDisabled?: boolean;
  /** Filters which outside elements dismiss the modal. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Where the modal is rendered. @default document.body */
  portalContainer?: string | HTMLElement;
  /**
   * Inline style for the backdrop.
   *
   * Declared rather than left to fallthrough because the viewport custom properties are merged
   * **over** it: three rules in the stylesheet size the modal from them, and a caller's `style`
   * winning would leave the modal with no height at all.
   */
  style?: CSSProperties | string;
  /** Forces the entry state on both elements, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state on both elements. */
  isExiting?: boolean;
}

export interface ModalContainerProps {
  class?: string;
  /** @default "auto" */
  placement?: ModalPlacement;
  /** Whether the dialog scrolls its own body or the page scrolls behind it. @default "inside" */
  scroll?: ModalVariants["scroll"];
  /** @default "md" */
  size?: ModalVariants["size"];
}

export interface ModalDialogProps {
  class?: string;
}

export interface ModalDialogSlotProps {
  /** Closes the modal, for a control inside the dialog that is not a `ModalClose`. */
  close: () => void;
}

export interface ModalHeaderProps {
  class?: string;
}

export interface ModalHeadingProps {
  class?: string;
  /** Heading level. @default 2 */
  level?: number;
}

export interface ModalIconProps {
  class?: string;
}

export interface ModalBodyProps {
  class?: string;
}

export interface ModalFooterProps {
  class?: string;
}

export interface ModalCloseTriggerProps {
  class?: string;
}
