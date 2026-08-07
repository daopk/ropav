import type {
  FocusStrategy,
  OverlayTriggerState,
  RootMenuTriggerState,
} from "../../composables/use-overlay-trigger-state";
import type {Placement} from "../../utils/position";
import type {dropdownVariants} from "@heroui/styles";
import type {ComputedRef, ShallowRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface DropdownContext {
  /**
   * The whole tree's open state, held on the root.
   *
   * A submenu asks it whether its own trigger is the one expanded at its level rather than holding
   * a flag of its own, which is what keeps a single path through the tree open.
   */
  state: RootMenuTriggerState;
  slots: ComputedRef<ReturnType<typeof dropdownVariants>>;
  /**
   * The element the root popover renders as its own portal target.
   *
   * Submenus are teleported into it rather than to the body, so the whole open menu tree is one
   * subtree. That is what lets the tree be described to assistive technology as a single thing
   * while everything around it is hidden.
   */
  popoverContainer: ShallowRef<HTMLElement | null>;
}

/** Strict: every part of a dropdown needs the state the root holds. */
export const [useDropdownContext, provideDropdownContext] = createContext<DropdownContext>({
  name: "DropdownContext",
});

/**
 * What one popover in the tree is for: which trigger opened it, where it goes, and what it names.
 *
 * Provided by the dropdown root for the outermost popover and overridden by each submenu trigger,
 * so a popover reads its own role from whatever is nearest above it and needs to know nothing
 * about how deep it sits.
 */
export interface DropdownPopoverTarget {
  state: OverlayTriggerState;
  /** Rendered as `data-trigger`, which tells the two apart in the DOM and in the stylesheet. */
  trigger: "MenuTrigger" | "SubmenuTrigger";
  placement: Placement;
  /** What the popover is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
  /** The id the menu inside carries, which the trigger's `aria-controls` points at. */
  overlayId: ComputedRef<string>;
  /** The id of the element naming the popover and the menu inside it. */
  labelledBy: ComputedRef<string>;
  /**
   * Whether the page behind stays interactive. A submenu is non-modal: the menu that opened it is
   * behind it and has to keep working.
   */
  isNonModal: boolean;
  /** Filters which outside elements dismiss the popover. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Where focus lands in the menu when it appears. */
  autoFocus: ComputedRef<boolean | FocusStrategy>;
  /** Closes this popover and every menu above it, which choosing an item does. */
  closeAll: () => void;
  /**
   * Reports the popover element back, for whatever owns it. A submenu trigger needs it to guard the
   * pointer's path from the trigger to the submenu.
   */
  registerOverlayElement?: (element: HTMLElement | null) => void;
  /** Keys the popover hands on before dismissal sees them, e.g. ArrowLeft closing a submenu. */
  onKeydown?: (event: KeyboardEvent) => void;
}

export const [useDropdownPopoverTarget, provideDropdownPopoverTarget] =
  createContext<DropdownPopoverTarget>({name: "DropdownPopoverTarget"});
