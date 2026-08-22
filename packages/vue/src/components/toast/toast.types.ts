import type {ButtonRootProps} from "../button";
import type {ToastVariants} from "@heroui/styles";
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
