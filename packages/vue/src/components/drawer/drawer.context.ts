import type {DrawerPlacement} from "./drawer.types";
import type {OverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import type {drawerVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface DrawerContext {
  /**
   * The slot set, accumulated down the tree.
   *
   * Each level merges its own variants over what it was given, which is how the backdrop can decide
   * its own variant and the content the edge everything slides from.
   */
  slots: ComputedRef<ReturnType<typeof drawerVariants>>;
  state: OverlayTriggerState;
  /** The id the dialog carries, which the trigger's `aria-controls` points at. */
  dialogId: ComputedRef<string>;
  /** The trigger's id, which names the dialog when nothing inside it does. */
  labelledBy: ComputedRef<string>;
  /** Set by the content, read by the dialog — the edge decides which corners are rounded. */
  placement: ComputedRef<DrawerPlacement | undefined>;
}

/**
 * Strict, and keyed to this component alone.
 *
 * A key shared with the modal family would resolve to the nearest ancestor that provided it, so a
 * drawer opened from inside a modal would read the modal's slots and state.
 */
export const [useDrawerContext, provideDrawerContext] = createContext<DrawerContext>({
  name: "DrawerContext",
});

/**
 * What the backdrop offers the content inside it.
 *
 * Split from `DrawerContext` because it flows the other way as well: the backdrop owns the
 * machinery but the *content* is the element that machinery acts on — the dismiss boundary, the
 * subtree left visible to assistive technology, the focus scope — so the content reports itself up
 * through here rather than the backdrop reaching down for it.
 */
export interface DrawerOverlayContext {
  /** The content reports itself; the backdrop measures and guards it. */
  registerContentElement: (element: HTMLElement | null) => void;
  isContentEntering: ComputedRef<boolean>;
  /**
   * The union of both elements' exits, reported to both.
   *
   * Load-bearing here in a way it is not for a modal: the panel's own `translate` transition lives
   * on the dialog, a *descendant* of the content, and `getAnimations()` does not look into a
   * subtree. Left to itself the content would report no animation and vanish instantly; what keeps
   * it on screen for the slide out is the backdrop's opacity transition, the other half of the
   * union.
   */
  isExiting: ComputedRef<boolean>;
  /** Whether the drawer can be dismissed — by pressing outside it, and by dragging it away. */
  isDismissable: ComputedRef<boolean>;
  /** Escape, bound on the content so a key pressed inside the dialog reaches it. */
  onKeydown: (event: KeyboardEvent) => void;
  close: () => void;
}

/** Loose: content outside a backdrop renders, it simply has no machinery behind it. */
export const [useDrawerOverlayContext, provideDrawerOverlayContext] =
  createContext<DrawerOverlayContext | null>({
    defaultValue: null,
    name: "DrawerOverlayContext",
    strict: false,
  });
