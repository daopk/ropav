import type {AlertDialogPlacement} from "./alert-dialog.types";
import type {OverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import type {alertDialogVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface AlertDialogContext {
  /**
   * The slot set, accumulated down the tree.
   *
   * Each level merges its own variants over what it was given, which is how the backdrop can decide
   * its own variant and the container the dialog's size without either knowing about the other.
   */
  slots: ComputedRef<ReturnType<typeof alertDialogVariants>>;
  state: OverlayTriggerState;
  /** The id the dialog carries, which the trigger's `aria-controls` points at. */
  dialogId: ComputedRef<string>;
  /** The trigger's id, which names the dialog when nothing inside it does. */
  labelledBy: ComputedRef<string>;
  /** Set by the container, read by the dialog — which is the element the margins land on. */
  placement: ComputedRef<AlertDialogPlacement | undefined>;
}

/**
 * Strict, and keyed to this component alone.
 *
 * A key shared with the modal family would resolve to the nearest ancestor that provided it, so an
 * alert dialog confirming an action taken inside a drawer would read the drawer's slots and state.
 */
export const [useAlertDialogContext, provideAlertDialogContext] = createContext<AlertDialogContext>(
  {
    name: "AlertDialogContext",
  },
);

/**
 * What the backdrop offers the container inside it.
 *
 * Split from `AlertDialogContext` because it flows the other way as well: the backdrop owns the
 * machinery but the *container* is the element that machinery acts on — the dismiss boundary, the
 * subtree left visible to assistive technology, the focus scope — so the container reports itself up
 * through here rather than the backdrop reaching down for it.
 */
export interface AlertDialogOverlayContext {
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
export const [useAlertDialogOverlayContext, provideAlertDialogOverlayContext] =
  createContext<AlertDialogOverlayContext | null>({
    defaultValue: null,
    name: "AlertDialogOverlayContext",
    strict: false,
  });
