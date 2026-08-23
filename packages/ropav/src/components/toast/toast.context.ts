import type {QueuedToast} from "./toast.types";
import type {ToastContentAttrs} from "../../composables/use-toast";
import type {ToastVariants, toastVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

/**
 * What the region offers every toast inside it.
 *
 * Provided by the provider rather than by anything deeper, because the toasts may be written by
 * the caller and handed in through its slot: a `provide` made inside the teleport would not reach
 * content whose ancestry runs through the provider.
 */
export interface ToastRegionContext {
  /** Closes one toast by key. */
  close: (key: string) => void;
  gap: ComputedRef<number>;
  /** Every mounted toast's measured height, so a stacked toast can be clipped to the front one. */
  heightsByKey: ComputedRef<Record<string, number>>;
  maxVisibleToasts: ComputedRef<number>;
  onToastHeightChange: (key: string, height: number) => void;
  onToastHeightRemove: (key: string) => void;
  placement: ComputedRef<ToastVariants["placement"]>;
  scaleFactor: ComputedRef<number>;
  slots: ComputedRef<ReturnType<typeof toastVariants>>;
  visibleToasts: ComputedRef<QueuedToast[]>;
}

/** What one toast offers its own parts. */
export interface ToastItemContext {
  /** Closes this toast. */
  close: () => void;
  contentAttrs: ComputedRef<ToastContentAttrs>;
  descriptionAttrs: ComputedRef<{id: string}>;
  /** Called by a rendered description so the toast points `aria-describedby` at it. */
  registerDescription: () => () => void;
  titleAttrs: ComputedRef<{id: string}>;
  variant: ComputedRef<ToastVariants["variant"]>;
}

export const [useToastRegionContext, provideToastRegionContext] = createContext<ToastRegionContext>(
  {name: "ToastRegionContext"},
);

export const [useToastItemContext, provideToastItemContext] = createContext<ToastItemContext>({
  name: "ToastItemContext",
});
