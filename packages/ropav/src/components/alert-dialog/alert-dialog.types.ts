import type {OverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import type {AlertDialogVariants} from "@heroui/styles";
import type {CSSProperties} from "vue";

/** Where the dialog sits in the container. `auto` is bottom on a phone and centred above it. */
export type AlertDialogPlacement = "auto" | "top" | "center" | "bottom";

/** Which meaning the icon carries, and so which default glyph and colours it takes. */
export type AlertDialogStatus = "default" | "accent" | "success" | "warning" | "danger";

export interface AlertDialogRootProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  /**
   * An open state held outside the dialog, for a caller driving several overlays from one place.
   *
   * Equivalent to passing `isOpen` and listening to `openChange`, and takes precedence over both.
   */
  state?: OverlayTriggerState;
}

export interface AlertDialogRootEmits {
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
}

export interface AlertDialogTriggerProps {
  class?: string;
}

export interface AlertDialogBackdropProps {
  class?: string;
  /** How the page behind the dialog is treated. @default "opaque" */
  variant?: AlertDialogVariants["variant"];
  /**
   * Whether an interaction outside the dialog closes it.
   *
   * An alert dialog asks for a decision, so the default is the opposite of a modal's: dismissing it
   * by clicking away would answer the question by accident.
   *
   * @default false
   */
  isDismissable?: boolean;
  /** Whether Escape leaves the question unanswered. @default true */
  isKeyboardDismissDisabled?: boolean;
  /** Filters which outside elements dismiss the dialog. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Where the dialog is rendered. @default document.body */
  portalContainer?: string | HTMLElement;
  /**
   * Inline style for the backdrop.
   *
   * Declared rather than left to fallthrough because the viewport custom properties are merged
   * over it: the stylesheet sizes the dialog from them, and a caller's own style winning would
   * leave it with no height at all.
   */
  style?: CSSProperties | string;
  /** Forces the entry state on both elements, for a caller driving the animation itself. */
  isEntering?: boolean;
  /** Forces the exit state on both elements. */
  isExiting?: boolean;
}

export interface AlertDialogContainerProps {
  class?: string;
  /** @default "auto" */
  placement?: AlertDialogPlacement;
  /** @default "md" */
  size?: AlertDialogVariants["size"];
}

export interface AlertDialogDialogProps {
  class?: string;
}

export interface AlertDialogDialogSlotProps {
  /** Closes the dialog, for a control inside it that is not an `AlertDialog.Close`. */
  close: () => void;
}

export interface AlertDialogHeaderProps {
  class?: string;
}

export interface AlertDialogHeadingProps {
  class?: string;
  /** Heading level. @default 2 */
  level?: number;
}

export interface AlertDialogIconProps {
  class?: string;
  /**
   * The meaning the icon carries, which picks both its colours and its default glyph.
   *
   * Read per icon rather than from the dialog, so two icons in one dialog can say different things.
   *
   * @default "danger"
   */
  status?: AlertDialogStatus;
}

export interface AlertDialogBodyProps {
  class?: string;
}

export interface AlertDialogFooterProps {
  class?: string;
}

export interface AlertDialogCloseTriggerProps {
  class?: string;
}
