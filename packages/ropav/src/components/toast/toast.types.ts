import type {Timer, ToastQueue} from "./toast-queue";
import type {ButtonRootProps} from "../button";
import type {ToastVariants} from "@ropav/styles";
import type {Component} from "vue";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
/**
 * Anything the imperative API can be handed to render.
 *
 * `@heroui/react` types the same slots as `ReactNode`, which has no equivalent a queue can hold
 * and a template can insert — Vapor has no detached-node value at all. A component covers the
 * same ground: primitives render as text, a component renders through `<component :is>`, and
 * anything richer is a component the caller writes.
 */
export type ToastRenderable = Component | number | string;

/** The action button offered on a toast added through the imperative API. */
export interface ToastActionValue extends /* @vue-ignore */ ButtonRootProps {
  /** What the button says. */
  label?: ToastRenderable;
  /** Called when the button is activated. */
  onPress?: () => void;
}

/** What one queued toast carries, and what the default toast tree renders from. */
export interface ToastContentValue {
  actionProps?: ToastActionValue;
  description?: ToastRenderable;
  /** `null` removes the indicator; absent renders the variant's own icon. */
  indicator?: ToastRenderable | null;
  /** Replaces the indicator with a spinner. */
  isLoading?: boolean;
  title?: ToastRenderable;
  variant?: ToastVariants["variant"];
}

/* -------------------------------------------------------------------------------------------------
 * Queue
 * -----------------------------------------------------------------------------------------------*/
/** Why the visible toasts changed, for a `wrapUpdate` that treats the three differently. */
export type ToastAction = "add" | "clear" | "remove";

export interface ToastOptions {
  /** Called when the toast closes, whether by the user or by its own timeout. */
  onClose?: () => void;
  /** Milliseconds to live for. `0` never expires. */
  timeout?: number;
}

export interface ToastQueueOptions {
  /**
   * How many toasts the region draws at once.
   *
   * Read by the region as its default, not enforced here: the queue keeps every toast so one can
   * come back when the toasts in front of it close.
   */
  maxVisibleToasts?: number;
  /** Wraps every update, so a caller can run it inside `document.startViewTransition()`. */
  wrapUpdate?: (fn: () => void, action: ToastAction) => void;
}

/** Everything the imperative `toast()` accepts beyond the message itself. */
export interface ToastAddOptions extends ToastOptions {
  actionProps?: ToastActionValue;
  description?: ToastRenderable;
  indicator?: ToastRenderable | null;
  isLoading?: boolean;
  variant?: ToastContentValue["variant"];
}

/**
 * The three messages a promise toast moves through.
 *
 * `success` and `error` may be a function of the resolved value. That form is *undecidable* from a
 * functional component at runtime — both are plain functions — so a function here is always read
 * as a message factory. A component that happens to be a function has to be wrapped
 * (`defineComponent`/`defineVaporComponent`) to be passed. `@heroui/react` never meets this
 * because a `ReactNode` is never callable.
 */
export interface ToastPromiseOptions<T = unknown> {
  error: ToastRenderable | ((error: Error) => ToastRenderable);
  loading: ToastRenderable;
  success: ToastRenderable | ((data: T) => ToastRenderable);
}

/** One toast as the queue holds it. */
export interface QueuedToast<T = ToastContentValue> extends ToastOptions {
  content: T;
  key: string;
  timer?: Timer;
}

/* -------------------------------------------------------------------------------------------------
 * Parts
 * -----------------------------------------------------------------------------------------------*/
export interface ToastProviderProps {
  /** Names the region explicitly instead of with its notification count. */
  ariaLabel?: string;
  class?: string;
  /** Pixels between stacked toasts. @default 12 */
  gap?: number;
  /**
   * How many toasts are drawn at once. Visual only — the rest are faded out, not dropped.
   *
   * Defaults to the queue's own hint, and to 3 when it has none.
   */
  maxVisibleToasts?: number;
  /** Where the stack sits. @default "bottom" */
  placement?: ToastVariants["placement"];
  /** Where the region is rendered. @default "body" */
  portalContainer?: HTMLElement | string;
  /** The queue to render. Defaults to the one the imperative `toast()` writes to. */
  queue?: ToastQueue;
  /** How much smaller each toast is drawn than the one in front of it. @default 0.05 */
  scaleFactor?: number;
  /** A number is read as pixels. @default 460 */
  width?: number | string;
}

/** What a custom toast tree is handed for each toast. */
export interface ToastProviderSlotProps {
  isLoading: boolean;
  toast: QueuedToast;
}

export interface ToastRootProps {
  class?: string;
  /** Overrides the region's placement for this toast. */
  placement?: ToastVariants["placement"];
  /** Overrides the region's scale factor for this toast. */
  scaleFactor?: number;
  toast: QueuedToast;
  variant?: ToastVariants["variant"];
}

export interface ToastContentProps {
  class?: string;
}

export interface ToastIndicatorProps {
  class?: string;
  /** Picks the default icon. Falls back to the toast's own variant. */
  variant?: ToastVariants["variant"];
}

export interface ToastTitleProps {
  class?: string;
}

export interface ToastDescriptionProps {
  class?: string;
}

export interface ToastCloseButtonProps {
  class?: string;
}

export interface ToastActionButtonProps extends ButtonRootProps {
  class?: string;
}

/** Renders a title, description, indicator or action label handed in through the queue. */
export interface ToastRenderableProps {
  value?: ToastRenderable | null;
}
