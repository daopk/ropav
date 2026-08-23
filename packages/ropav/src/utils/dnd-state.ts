import type { DropOperationMask } from "./dnd-constants";
import type { DragKey, DropEffect } from "./dnd-types";
import type { ShallowRef } from "vue";

import { DROP_OPERATION } from "./dnd-constants";

/**
 * State shared by every collection taking part in the drag currently in flight.
 *
 * Ported from the module-level globals in React Aria's `dnd/utils.ts`, and deliberately **not**
 * reactive. A drag is a single global gesture — there is exactly one at a time in a document —
 * and the questions asked of it ("did this drag start in the collection I am dropping on?") are
 * asked from inside event handlers, where the answer must be the one that is true *now* rather
 * than the one a render happened to capture.
 *
 * The Vue shape differs from React's in one place: a collection is identified by a
 * `ShallowRef<HTMLElement | null>` read through `.value`, where React uses a `RefObject` read
 * through `.current`. That matches how every collection in this package already holds its own
 * element (`shallowRef<HTMLElement | null>(null)`).
 */
export interface DnDState {
  /** The collection the dragged items came from, if the drag started inside one. */
  draggingCollectionRef?: ShallowRef<HTMLElement | null>;
  /** Keys currently being dragged. Empty when the drag came from outside any collection. */
  draggingKeys: Set<DragKey>;
  /** The collection currently targeted for a drop, if any. */
  dropCollectionRef?: ShallowRef<HTMLElement | null>;
}

export let globalDndState: DnDState = { draggingKeys: new Set() };

export const setDraggingCollectionRef = (ref: ShallowRef<HTMLElement | null>): void => {
  globalDndState.draggingCollectionRef = ref;
};

export const setDraggingKeys = (keys: Set<DragKey>): void => {
  globalDndState.draggingKeys = keys;
};

export const setDropCollectionRef = (ref?: ShallowRef<HTMLElement | null>): void => {
  globalDndState.dropCollectionRef = ref;
};

export const clearGlobalDnDState = (): void => {
  globalDndState = { draggingKeys: new Set() };
};

export const setGlobalDnDState = (state: DnDState): void => {
  globalDndState = state;
};

/**
 * Whether the drag in flight started in the same collection it is now over.
 *
 * This is the question that separates a reorder from an insert, and it cannot be answered from
 * the `DataTransfer` — a drag from another app and a drag from the list next door look identical
 * on the wire. Takes an optional ref for the case where the drop collection has not registered
 * itself globally yet, which happens on the very first `dragenter`.
 */
export const isInternalDropOperation = (ref?: ShallowRef<HTMLElement | null>): boolean => {
  const { draggingCollectionRef, dropCollectionRef } = globalDndState;

  return (
    draggingCollectionRef?.value != null &&
    draggingCollectionRef.value === (ref?.value ?? dropCollectionRef?.value)
  );
};

/**
 * The `dropEffect` the drop target settled on, read back after the drag ends.
 *
 * Separate from the state object above because it outlives it: `dragend` fires after the drop
 * target has already torn its own state down, and the drag source still needs to know whether
 * to delete the items it just handed over.
 */
export let globalDropEffect: DropEffect | undefined;

export const setGlobalDropEffect = (dropEffect: DropEffect | undefined): void => {
  globalDropEffect = dropEffect;
};

/** Operations the drag source said it would accept, as a `DROP_OPERATION` bitmask. */
export let globalAllowedDropOperations: DropOperationMask = DROP_OPERATION.none;

export const setGlobalAllowedDropOperations = (operations: DropOperationMask): void => {
  globalAllowedDropOperations = operations;
};
