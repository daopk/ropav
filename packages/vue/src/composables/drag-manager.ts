import type {
  DragEndEvent,
  DragItem,
  DropActivateEvent,
  DropEnterEvent,
  DropEvent,
  DropExitEvent,
  DropItem,
  DropOperation,
  DropTarget as DropTargetDescriptor,
} from "../utils/dnd-types";
import type {Ref, ShallowRef} from "vue";

import {onScopeDispose, readonly, shallowRef} from "vue";

import {ariaHideOutside} from "../utils/aria-hide-outside";
import {getTypes} from "../utils/dnd-data-transfer";
import {DRAG_STARTED, DROP_CANCELED, DROP_COMPLETE} from "../utils/dnd-messages";
import {announce} from "../utils/live-announcer";

import {getDragModality} from "./drag-modality";
import {isVirtualClick, isVirtualPointerEvent} from "./use-press";

/**
 * The keyboard and screen reader drag session, ported from React Aria's `dnd/DragManager.ts`.
 *
 * Native HTML drag and drop is pointer-only: there is no key that starts a `dragstart`, and a
 * screen reader's synthetic click cannot express one either. This module is the parallel
 * implementation for those users — it takes over the document, walks focus between the registered
 * drop targets, and calls the same callbacks the native path calls.
 *
 * **Module-level singletons on purpose.** A drag is one global gesture, so there is exactly one
 * session, one registry of drop targets and one of drop items per document. React Aria keeps
 * these at module scope for the same reason and the port must too: making them reactive
 * per-component state would let two collections disagree about whether a drag is in flight.
 */

/** Anything that can hold focus. Plain `HTMLElement`, as everywhere else in this package. */
type FocusableElement = HTMLElement;

export interface DragManagerDropTarget {
  element: FocusableElement;
  preventFocusOnDrop?: boolean;
  getDropOperation?: (types: Set<string>, allowedOperations: DropOperation[]) => DropOperation;
  onDropEnter?: (event: DropEnterEvent, dragTarget: DragManagerDragTarget) => void;
  onDropExit?: (event: DropExitEvent) => void;
  onDropTargetEnter?: (target: DropTargetDescriptor | null) => void;
  onDropActivate?: (event: DropActivateEvent, target: DropTargetDescriptor | null) => void;
  onDrop?: (event: DropEvent, target: DropTargetDescriptor | null) => void;
  onKeyDown?: (event: KeyboardEvent, dragTarget: DragManagerDragTarget) => void;
  activateButtonRef?: ShallowRef<FocusableElement | null>;
}

export interface DragManagerDropItem {
  element: FocusableElement;
  target: DropTargetDescriptor;
  getDropOperation?: (types: Set<string>, allowedOperations: DropOperation[]) => DropOperation;
  activateButtonRef?: ShallowRef<FocusableElement | null>;
}

export interface DragManagerDragTarget {
  element: FocusableElement;
  items: DragItem[];
  allowedDropOperations: DropOperation[];
  onDragEnd?: (event: DragEndEvent) => void;
}

const dropTargets = new Map<Element, DragManagerDropTarget>();
const dropItems = new Map<Element, DragManagerDropItem>();
const subscriptions = new Set<() => void>();
let dragSession: DragSession | null = null;

/**
 * Every event a drag session swallows while it owns the document.
 *
 * The session is a modal state: a stray hover must not change a drop target, and a click must
 * not activate whatever is underneath. Focus events are included because focus is how the
 * session moves between targets, and it has to be the only thing moving it.
 */
const CANCELED_EVENTS = [
  "pointerdown",
  "pointermove",
  "pointerenter",
  "pointerleave",
  "pointerover",
  "pointerout",
  "pointerup",
  "mousedown",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "mouseover",
  "mouseout",
  "mouseup",
  "touchstart",
  "touchmove",
  "touchend",
  "focusin",
  "focusout",
];

/**
 * Swallowed but never `preventDefault`ed.
 *
 * Calling `preventDefault` on these would suppress the `click` that follows, and `click` is how
 * a screen reader's virtual drop arrives.
 */
const CLICK_EVENTS = ["pointerup", "mouseup", "touchend"];

/** Elements the session has hidden from assistive technology are also out of bounds for focus. */
const HIDDEN_SELECTOR = '[aria-hidden="true"], [inert]';

const contains = (node: Element | null | undefined, other: Node | null | undefined): boolean =>
  node != null && other != null && node.contains(other);

const centerOf = (element: Element): {x: number; y: number} => {
  const rect = element.getBoundingClientRect();

  return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
};

const notifySubscribers = (): void => {
  for (const callback of subscriptions) callback();
};

/**
 * Register a drop target for the duration of a drag session, returning the unregister.
 *
 * Registering mid-session is normal rather than exceptional — a collection that mounts while a
 * drag is in flight must join it — so the valid target list is recomputed on both ends.
 */
export const registerDropTarget = (target: DragManagerDropTarget): (() => void) => {
  dropTargets.set(target.element, target);
  dragSession?.updateValidDropTargets();

  return () => {
    dropTargets.delete(target.element);
    dragSession?.updateValidDropTargets();
  };
};

/** Register an individual item within a droppable collection, returning the unregister. */
export const registerDropItem = (item: DragManagerDropItem): (() => void) => {
  dropItems.set(item.element, item);

  return () => {
    dropItems.delete(item.element);
  };
};

/**
 * Start a keyboard or screen reader drag.
 *
 * Throws when one is already in flight. That is deliberate upstream and kept here: two
 * overlapping sessions would both own the document's event listeners, and the second teardown
 * would strip the first session's, leaving the page permanently swallowing pointer events.
 *
 * Setup is deferred a frame because the drag typically starts from a keystroke that is still
 * propagating — attaching the capture listeners synchronously would make the session swallow the
 * tail of the very event that started it.
 */
export const beginDragging = (target: DragManagerDragTarget): void => {
  if (dragSession) throw new Error("Cannot begin dragging while already dragging");

  dragSession = new DragSession(target);
  requestAnimationFrame(() => {
    if (!dragSession) return;

    dragSession.setup();
    // The keyboard flow has no pointer to indicate intent, so it opens on the first target.
    if (getDragModality() === "keyboard") dragSession.next();
  });

  notifySubscribers();
};

const endDragging = (): void => {
  dragSession = null;
  notifySubscribers();
};

/** Whether a keyboard or screen reader drag is in flight. */
export const isVirtualDragging = (): boolean => dragSession != null;

/** Whether an element is inside a registered drop target. */
export const isValidDropTarget = (element: Element): boolean => {
  for (const target of dropTargets.keys()) {
    if (contains(target, element)) return true;
  }

  return false;
};

/**
 * The session in flight, as a ref that updates when one starts or ends.
 *
 * React Aria subscribes with `useState` + `useEffect`; the Vue shape is a shallow ref fed by the
 * same subscription set. Read-only, because the session is owned by this module — a component
 * ends a drag by calling into it, never by assigning here.
 */
export const useDragSession = (): Readonly<Ref<DragSession | null>> => {
  const session = shallowRef<DragSession | null>(dragSession);
  const callback = () => {
    session.value = dragSession;
  };

  subscriptions.add(callback);
  onScopeDispose(() => {
    subscriptions.delete(callback);
  });

  return readonly(session) as Readonly<Ref<DragSession | null>>;
};

const findValidDropTargets = (target: DragManagerDragTarget): DragManagerDropTarget[] => {
  const types = getTypes(target.items);

  return [...dropTargets.values()].filter((candidate) => {
    if (candidate.element.closest(HIDDEN_SELECTOR)) return false;

    if (typeof candidate.getDropOperation === "function") {
      return candidate.getDropOperation(types, target.allowedDropOperations) !== "cancel";
    }

    return true;
  });
};

export class DragSession {
  dragTarget: DragManagerDragTarget;
  validDropTargets: DragManagerDropTarget[] = [];
  currentDropTarget: DragManagerDropTarget | null = null;
  currentDropItem: DragManagerDropItem | null = null;
  dropOperation: DropOperation | null = null;

  private mutationObserver: MutationObserver | null = null;
  private restoreAriaHidden: (() => void) | null = null;
  private isVirtualClick = false;
  private initialFocused = false;

  constructor(target: DragManagerDragTarget) {
    this.dragTarget = target;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.cancelEvent = this.cancelEvent.bind(this);
  }

  setup(): void {
    document.addEventListener("keydown", this.onKeyDown, true);
    document.addEventListener("keyup", this.onKeyUp, true);
    window.addEventListener("focus", this.onFocus, true);
    window.addEventListener("blur", this.onBlur, true);
    document.addEventListener("click", this.onClick, true);
    document.addEventListener("pointerdown", this.onPointerDown, true);

    for (const event of CANCELED_EVENTS) {
      document.addEventListener(event, this.cancelEvent, true);
    }

    this.mutationObserver = new MutationObserver(() => this.updateValidDropTargets());
    this.updateValidDropTargets();

    announce(DRAG_STARTED[getDragModality()]);
  }

  teardown(): void {
    document.removeEventListener("keydown", this.onKeyDown, true);
    document.removeEventListener("keyup", this.onKeyUp, true);
    window.removeEventListener("focus", this.onFocus, true);
    window.removeEventListener("blur", this.onBlur, true);
    document.removeEventListener("click", this.onClick, true);
    document.removeEventListener("pointerdown", this.onPointerDown, true);

    for (const event of CANCELED_EVENTS) {
      document.removeEventListener(event, this.cancelEvent, true);
    }

    this.mutationObserver?.disconnect();
    this.restoreAriaHidden?.();
  }

  onKeyDown(event: KeyboardEvent): void {
    this.cancelEvent(event);

    if (event.key === "Escape") {
      this.cancel();

      return;
    }

    if (event.key === "Tab" && !(event.metaKey || event.altKey || event.ctrlKey)) {
      if (event.shiftKey) {
        this.previous();
      } else {
        this.next();
      }
    }

    this.currentDropTarget?.onKeyDown?.(event, this.dragTarget);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.cancelEvent(event);

    if (event.key !== "Enter") return;

    // Alt+Enter, or Enter while focus sits on the activate button, means "open this target"
    // rather than "drop here" — the way a tree row is expanded without ending the drag.
    if (event.altKey || contains(this.getCurrentActivateButton(), event.target as Node | null)) {
      this.activate(this.currentDropTarget, this.currentDropItem);
    } else {
      this.drop();
    }
  }

  getCurrentActivateButton(): FocusableElement | null {
    return (
      this.currentDropItem?.activateButtonRef?.value ??
      this.currentDropTarget?.activateButtonRef?.value ??
      null
    );
  }

  onFocus(event: FocusEvent): void {
    const activateButton = this.getCurrentActivateButton();
    const eventTarget = event.target;

    if (eventTarget === activateButton) {
      this.cancelEvent(event);

      return;
    }

    // Focus may only rest on a drop target or on the element the drag came from.
    if (eventTarget !== this.dragTarget.element) this.cancelEvent(event);

    if (!(eventTarget instanceof HTMLElement) || eventTarget === this.dragTarget.element) return;

    const dropTarget =
      this.validDropTargets.find((target) => target.element === eventTarget) ??
      this.validDropTargets.find((target) => contains(target.element, eventTarget));

    if (!dropTarget) {
      // Focus escaped the session; pull it back rather than letting the drag be abandoned
      // somewhere the user cannot end it.
      (this.currentDropTarget?.element ?? this.dragTarget.element).focus();

      return;
    }

    this.setCurrentDropTarget(dropTarget, dropItems.get(eventTarget));
  }

  onBlur(event: FocusEvent): void {
    const activateButton = this.getCurrentActivateButton();

    // Guarded on non-null: with no activate button, focus lost to nothing also reports a `null`
    // related target, and that case belongs to the restore below rather than here.
    if (activateButton && event.relatedTarget === activateButton) {
      this.cancelEvent(event);

      return;
    }

    if (event.target !== this.dragTarget.element) this.cancelEvent(event);

    // Nothing is gaining focus — or the document is, which is how jsdom reports the same thing.
    if (!event.relatedTarget || !(event.relatedTarget instanceof HTMLElement)) {
      (this.currentDropTarget?.element ?? this.dragTarget.element).focus();
    }
  }

  onClick(event: MouseEvent): void {
    this.cancelEvent(event);

    if (!isVirtualClick(event) && !this.isVirtualClick) return;

    const eventTarget = event.target as HTMLElement | null;
    const item = [...dropItems.values()].find(
      (candidate) =>
        candidate.element === eventTarget ||
        contains(candidate.activateButtonRef?.value, eventTarget),
    );
    const dropTarget = this.validDropTargets.find((target) =>
      contains(target.element, eventTarget),
    );
    const activateButton = item?.activateButtonRef?.value ?? dropTarget?.activateButtonRef?.value;

    if (contains(activateButton, eventTarget) && dropTarget) {
      this.activate(dropTarget, item);

      return;
    }

    // Clicking the element the drag started from is how a virtual user cancels.
    if (eventTarget === this.dragTarget.element) {
      this.cancel();

      return;
    }

    if (dropTarget) {
      this.setCurrentDropTarget(dropTarget, item);
      this.drop(item);
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.cancelEvent(event);
    // Android TalkBack's double tap reports `detail: 1` on the click, which is indistinguishable
    // from a real one by then. The pointer event before it still carries the tell.
    this.isVirtualClick = isVirtualPointerEvent(event);
  }

  cancelEvent(event: Event): void {
    const eventTarget = event.target;

    // Let focus move on and off the drag target itself, so its focus ring behaves normally.
    if (
      (event.type === "focusin" || event.type === "focusout") &&
      (eventTarget === this.dragTarget.element || eventTarget === this.getCurrentActivateButton())
    ) {
      return;
    }

    if (!CLICK_EVENTS.includes(event.type)) event.preventDefault();

    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  updateValidDropTargets(): void {
    if (!this.mutationObserver) return;

    // Stop observing while rewriting `inert`, or the rewrite would retrigger this.
    this.mutationObserver.disconnect();
    this.restoreAriaHidden?.();

    this.validDropTargets = findValidDropTargets(this.dragTarget);

    // Rotate the list so Tab starts from whatever is nearest the drag, rather than from
    // wherever the target happens to sit in registration order.
    if (this.validDropTargets.length > 0) {
      const nearestIndex = this.findNearestDropTarget();

      this.validDropTargets = [
        ...this.validDropTargets.slice(nearestIndex),
        ...this.validDropTargets.slice(0, nearestIndex),
      ];
    }

    if (this.currentDropTarget && !this.validDropTargets.includes(this.currentDropTarget)) {
      this.setCurrentDropTarget(this.validDropTargets[0] ?? null);
    }

    const types = getTypes(this.dragTarget.items);
    const validDropItems = [...dropItems.values()].filter((item) =>
      typeof item.getDropOperation === "function"
        ? item.getDropOperation(types, this.dragTarget.allowedDropOperations) !== "cancel"
        : true,
    );

    // A collection that holds its own visible items is not itself exposed — otherwise the
    // whole collection and each of its rows would both be reachable.
    const visibleDropTargets = this.validDropTargets.filter(
      (target) => !validDropItems.some((item) => contains(target.element, item.element)),
    );
    const withActivateButton = (
      entry: DragManagerDropItem | DragManagerDropTarget,
    ): FocusableElement[] =>
      entry.activateButtonRef?.value
        ? [entry.element, entry.activateButtonRef.value]
        : [entry.element];

    this.restoreAriaHidden = ariaHideOutside(
      [
        this.dragTarget.element,
        ...validDropItems.flatMap(withActivateButton),
        ...visibleDropTargets.flatMap(withActivateButton),
      ],
      {shouldUseInert: true},
    );

    this.mutationObserver.observe(document.body, {
      attributeFilter: ["aria-hidden", "inert"],
      attributes: true,
      subtree: true,
    });
  }

  next(): void {
    if (!this.currentDropTarget) {
      this.setCurrentDropTarget(this.validDropTargets[0] ?? null);

      return;
    }

    const index = this.validDropTargets.indexOf(this.currentDropTarget);

    if (index < 0) {
      this.setCurrentDropTarget(this.validDropTargets[0] ?? null);

      return;
    }

    if (index === this.validDropTargets.length - 1) {
      this.wrapToDragTarget(0);
    } else {
      this.setCurrentDropTarget(this.validDropTargets[index + 1] ?? null);
    }
  }

  previous(): void {
    const last = this.validDropTargets.length - 1;

    if (!this.currentDropTarget) {
      this.setCurrentDropTarget(this.validDropTargets[last] ?? null);

      return;
    }

    const index = this.validDropTargets.indexOf(this.currentDropTarget);

    if (index < 0) {
      this.setCurrentDropTarget(this.validDropTargets[last] ?? null);

      return;
    }

    if (index === 0) {
      this.wrapToDragTarget(last);
    } else {
      this.setCurrentDropTarget(this.validDropTargets[index - 1] ?? null);
    }
  }

  /**
   * At either end of the target list, hand focus back to the element the drag came from.
   *
   * That element is always reachable, so it gives a user with no Escape key — an iPad keyboard,
   * for one — somewhere to land and cancel from. If it has itself been hidden, there is nowhere
   * to go and the cycle wraps instead.
   */
  private wrapToDragTarget(fallbackIndex: number): void {
    if (this.dragTarget.element.closest(HIDDEN_SELECTOR)) {
      this.setCurrentDropTarget(this.validDropTargets[fallbackIndex] ?? null);

      return;
    }

    this.setCurrentDropTarget(null);
    this.dragTarget.element.focus();
  }

  findNearestDropTarget(): number {
    const dragTargetRect = this.dragTarget.element.getBoundingClientRect();
    let minDistance = Infinity;
    let nearest = -1;
    let ancestor = -1;

    for (let index = 0; index < this.validDropTargets.length; index++) {
      const dropTarget = this.validDropTargets[index];

      if (!dropTarget) continue;

      if (ancestor < 0 && contains(dropTarget.element, this.dragTarget.element)) ancestor = index;

      const rect = dropTarget.element.getBoundingClientRect();
      const dx = rect.left - dragTargetRect.left;
      const dy = rect.top - dragTargetRect.top;
      const distance = dx * dx + dy * dy;

      if (distance < minDistance) {
        minDistance = distance;
        nearest = index;
      }
    }

    // A collection the drag started inside wins outright: reordering within it is the likeliest
    // intent, however far its top left corner happens to be.
    return ancestor >= 0 ? ancestor : nearest;
  }

  setCurrentDropTarget(dropTarget: DragManagerDropTarget | null, item?: DragManagerDropItem): void {
    if (dropTarget !== this.currentDropTarget) {
      if (this.currentDropTarget?.onDropExit) {
        this.currentDropTarget.onDropExit({
          type: "dropexit",
          ...centerOf(this.currentDropTarget.element),
        });
      }

      this.currentDropTarget = dropTarget;

      if (dropTarget) {
        dropTarget.onDropEnter?.(
          {type: "dropenter", ...centerOf(dropTarget.element)},
          this.dragTarget,
        );

        // With an item, focus belongs on the item rather than on its collection.
        if (!item) dropTarget.element.focus();
      }
    }

    if (item != null && item !== this.currentDropItem) {
      this.currentDropTarget?.onDropTargetEnter?.(item.target);
      item.element.focus();
      this.currentDropItem = item;

      // The drag start announcement is assertive and would cut this off, so the first target is
      // announced politely once the opening announcement has had its turn.
      if (!this.initialFocused) {
        const label = item.element.getAttribute("aria-label");

        if (label) announce(label, "polite");
        this.initialFocused = true;
      }
    }
  }

  end(): void {
    this.teardown();
    endDragging();

    if (this.dragTarget.onDragEnd) {
      const target =
        this.currentDropTarget && this.dropOperation !== "cancel"
          ? this.currentDropTarget
          : this.dragTarget;

      this.dragTarget.onDragEnd({
        type: "dragend",
        ...centerOf(target.element),
        dropOperation: this.dropOperation ?? "cancel",
      });
    }

    if (this.currentDropTarget && !this.currentDropTarget.preventFocusOnDrop) {
      // Focus never actually moved during the drag — `cancelEvent` swallowed every focus event
      // — so state keyed on it, the focus ring in particular, is stale. Replay one.
      document.activeElement?.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
    }

    this.setCurrentDropTarget(null);
  }

  cancel(): void {
    this.setCurrentDropTarget(null);
    this.end();

    if (!this.dragTarget.element.closest(HIDDEN_SELECTOR)) this.dragTarget.element.focus();

    document.activeElement?.dispatchEvent(new FocusEvent("focusin", {bubbles: true}));
    announce(DROP_CANCELED);
  }

  drop(item?: DragManagerDropItem): void {
    if (!this.currentDropTarget) {
      this.cancel();

      return;
    }

    const types = getTypes(this.dragTarget.items);

    if (typeof item?.getDropOperation === "function") {
      this.dropOperation = item.getDropOperation(types, this.dragTarget.allowedDropOperations);
    } else if (typeof this.currentDropTarget.getDropOperation === "function") {
      this.dropOperation = this.currentDropTarget.getDropOperation(
        types,
        this.dragTarget.allowedDropOperations,
      );
    } else {
      this.dropOperation = this.dragTarget.allowedDropOperations[0] ?? "cancel";
    }

    if (this.currentDropTarget.onDrop) {
      // A keyboard drag never touched a `DataTransfer`, so the items are handed over directly
      // in the shape a native drop would have produced.
      const items: DropItem[] = this.dragTarget.items.map((dragItem) => ({
        getText: (type: string) => Promise.resolve(dragItem[type] ?? ""),
        kind: "text",
        types: new Set(Object.keys(dragItem)),
      }));

      this.currentDropTarget.onDrop(
        {
          type: "drop",
          ...centerOf(this.currentDropTarget.element),
          dropOperation: this.dropOperation,
          items,
        },
        item?.target ?? null,
      );
    }

    this.end();
    announce(DROP_COMPLETE);
  }

  activate(
    dropTarget: DragManagerDropTarget | null,
    dropItem: DragManagerDropItem | null | undefined,
  ): void {
    if (!dropTarget?.onDropActivate) return;

    dropTarget.onDropActivate(
      {type: "dropactivate", ...centerOf(dropTarget.element)},
      dropItem?.target ?? null,
    );
  }
}

/**
 * The session in flight, read once.
 *
 * The imperative sibling of `useDragSession`, for callers that are not inside an effect scope —
 * an event handler deciding whether a keystroke belongs to a drag, or a test ending one.
 */
export const getDragSession = (): DragSession | null => dragSession;
