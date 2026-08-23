import type {FocusStrategy, OverlayTriggerState} from "../../composables/use-overlay-trigger-state";
import type {Placement, PlacementAxis} from "../../utils/position";
import type {ComputedRef, ShallowRef} from "vue";

import {createContext} from "../../utils/create-context";

/**
 * What one positioned overlay is for: which trigger opened it, where it goes, and what it names.
 *
 * Provided by whatever owns the open state — a dropdown root, a submenu trigger, a popover root —
 * so the overlay reads its own role from whatever is nearest above it and needs to know nothing
 * about what kind of thing opened it.
 */
export interface OverlayTargetContext {
  state: OverlayTriggerState;
  /**
   * Rendered as `data-trigger`, which tells the kinds apart in the DOM and in the stylesheet.
   *
   * `"SubmenuTrigger"` is also read as behaviour: a submenu is non-modal yet still a dialog, and
   * it renders into the container its root popover made rather than into the body.
   */
  trigger: "MenuTrigger" | "SubmenuTrigger" | "DialogTrigger" | (string & {});
  placement: Placement;
  /** What the overlay is positioned against. */
  triggerElement: ComputedRef<HTMLElement | null>;
  /**
   * The id the content inside the overlay carries — a menu, a listbox — and the one the trigger's
   * `aria-controls` points at.
   */
  overlayId: ComputedRef<string>;
  /**
   * The id for the dialog: taken by the overlay element itself when it is the dialog, handed to a
   * nested one otherwise.
   *
   * Left undefined by a trigger whose content already owns an id, which is why a menu never ends
   * up with the same id on both the popover and the menu inside it.
   */
  dialogId?: ComputedRef<string | undefined>;
  /** The id of the element naming the overlay. */
  labelledBy: ComputedRef<string | undefined>;
  /**
   * Whether the page behind stays interactive. A submenu is non-modal: the menu that opened it is
   * behind it and has to keep working.
   */
  isNonModal: boolean;
  /** Filters which outside elements dismiss the overlay. */
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  /** Where focus lands in the content when it appears. */
  autoFocus: ComputedRef<boolean | FocusStrategy>;
  /** Closes this overlay and every one above it, which choosing a menu item does. */
  closeAll: () => void;
  /**
   * Reports the overlay element back, for whatever owns it. A submenu trigger needs it to guard
   * the pointer's path from the trigger to the submenu.
   */
  registerOverlayElement?: (element: HTMLElement | null) => void;
  /** Keys the overlay hands on before dismissal sees them, e.g. ArrowLeft closing a submenu. */
  onKeydown?: (event: KeyboardEvent) => void;
}

/** Strict: a positioned overlay is meaningless without a trigger to position against. */
export const [useOverlayTargetContext, provideOverlayTargetContext] =
  createContext<OverlayTargetContext>({name: "OverlayTargetContext"});

/**
 * The portal target shared by a group of nested overlays.
 *
 * The outermost overlay renders a `display: contents` element into the body and publishes it here;
 * everything nested inside renders into that same element, so the whole open tree is one subtree.
 * That is what lets it be described to assistive technology as a single thing while the rest of
 * the page is hidden, and it is also why a submenu is not rendered inside the menu that opened it:
 * that menu scrolls, and it would clip the submenu.
 */
export interface OverlayGroupContext {
  container: ShallowRef<HTMLElement | null>;
}

/** Loose: only an overlay nested inside another overlay's group has one above it. */
export const [useOverlayGroupContext, provideOverlayGroupContext] =
  createContext<OverlayGroupContext | null>({
    defaultValue: null,
    name: "OverlayGroupContext",
    strict: false,
  });

/** Where the arrow pointing at the trigger has to sit, published by the overlay around it. */
export interface OverlayArrowContext {
  style: ComputedRef<Record<string, string>>;
  placement: ComputedRef<PlacementAxis | null>;
  /**
   * The arrow reports itself so the overlay can measure it: its width reserves room on the cross
   * axis, so the overlay never sits so far along its trigger that the arrow would point past it.
   */
  registerElement: (element: Element | null) => void;
}

/** Loose: most overlays have no arrow. */
export const [useOverlayArrowContext, provideOverlayArrowContext] =
  createContext<OverlayArrowContext | null>({
    defaultValue: null,
    name: "OverlayArrowContext",
    strict: false,
  });

/** What the overlay offers to the content inside it. */
export interface OverlayScopeContext {
  close: () => void;
  /**
   * Declares that a dialog is rendered inside, so the overlay stops being one itself.
   *
   * Returns the release, called when that dialog goes away. Two elements with `role="dialog"`, one
   * inside the other, is not a thing assistive technology can make sense of.
   */
  registerDialog: () => () => void;
  /**
   * A dialog rendered inside asks for focus containment: the overlay itself is not the dialog, so
   * it would not otherwise contain anything.
   */
  requestFocusContain: () => () => void;
  /** The id the overlay declined to take, so the dialog inside can. */
  dialogId: ComputedRef<string | undefined>;
}

/** Loose: content is free to be rendered outside any overlay. */
export const [useOverlayScopeContext, provideOverlayScopeContext] =
  createContext<OverlayScopeContext | null>({
    defaultValue: null,
    name: "OverlayScopeContext",
    strict: false,
  });
