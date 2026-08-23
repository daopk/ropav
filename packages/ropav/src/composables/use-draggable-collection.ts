import type { UseDraggableCollectionStateReturn } from "./use-draggable-collection-state";
import type { ShallowRef } from "vue";

import { watchEffect } from "vue";

import { globalDndState, setDraggingCollectionRef } from "../utils/dnd-state";

/**
 * Marks this collection as the one a drag came from, ported from React Aria's
 * `useDraggableCollection`.
 *
 * The entire job is one global assignment, and it is what lets the drop side tell a reorder from
 * an insert: a drag from another application and a drag from the list next door look identical on
 * the wire, so the only way to know is for the source to say so.
 *
 * React does this during render. Here it is an effect on the dragged keys, which fires at the
 * same point in the drag — `startDrag` fills them, and this reacts to them appearing — and,
 * importantly, still runs before the first `dragenter` reads the global state.
 */
export const useDraggableCollection = (
  state: UseDraggableCollectionStateReturn<unknown>,
  element: ShallowRef<HTMLElement | null>,
): void => {
  watchEffect(() => {
    if (state.draggingKeys.value.size === 0) return;
    if (globalDndState.draggingCollectionRef?.value === element.value) return;

    setDraggingCollectionRef(element);
  });
};
