import type {ModalPlacement} from "./modal.types";
import type {OverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import type {modalVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ModalContext {
  /**
   * The slot set, accumulated down the tree.
   *
   * Each level merges its own variants over what it was given, which is how `Modal.Backdrop` can
   * decide the backdrop's variant and `Modal.Container` the dialog's size without either knowing
   * about the other. Matches React, including the fact that the container's merge overwrites the
   * backdrop slot with a default-variant one that nothing reads afterwards.
   */
  slots: ComputedRef<ReturnType<typeof modalVariants>>;
  state: OverlayTriggerState;
  /** The id the dialog carries, which the trigger's `aria-controls` points at. */
  dialogId: ComputedRef<string>;
  /** The trigger's id, which names the dialog when nothing inside it does. */
  labelledBy: ComputedRef<string>;
  /** Set by the container, read by the dialog — which is the element the margins land on. */
  placement: ComputedRef<ModalPlacement | undefined>;
}

/** Strict: every part of a modal is styled from the same accumulated slot set. */
export const [useModalContext, provideModalContext] = createContext<ModalContext>({
  name: "ModalContext",
});

/**
 * What the backdrop offers the container inside it.
 *
 * Split from `ModalContext` because it flows the other way as well: the backdrop owns the
 * machinery but the *container* is the element that machinery acts on — the dismiss boundary, the
 * subtree left visible to assistive technology, the focus scope — so the container reports itself
 * up through here rather than the backdrop reaching down for it.
 */
export interface ModalOverlayContext {
  /** The container reports itself; the backdrop measures and guards it. */
  registerContentElement: (element: HTMLElement | null) => void;
  isContentEntering: ComputedRef<boolean>;
  /** The union of both elements' exits, reported to both. */
  isExiting: ComputedRef<boolean>;
  isDismissable: ComputedRef<boolean>;
  /** Escape, bound on the container so a key pressed inside the dialog reaches it. */
  onKeydown: (event: KeyboardEvent) => void;
  close: () => void;
}

/** Loose: a container outside a backdrop renders, it simply has no machinery behind it. */
export const [useModalOverlayContext, provideModalOverlayContext] =
  createContext<ModalOverlayContext | null>({
    defaultValue: null,
    name: "ModalOverlayContext",
    strict: false,
  });
