import type {DropTarget} from "../utils/dnd-types";
import type {UseDroppableCollectionStateReturn} from "./use-droppable-collection-state";
import type {ComputedRef, ShallowRef} from "vue";

import {computed, watch} from "vue";

import {getTypes} from "../utils/dnd-data-transfer";
import {globalDndState, isInternalDropOperation} from "../utils/dnd-state";

import {registerDropItem, useDragSession} from "./drag-manager";
import {getDroppableCollectionElement} from "./droppable-collection-registry";
import {useVirtualDrop} from "./use-virtual-drop";

export interface UseDroppableItemOptions {
  /** The position within the collection this element stands for. */
  target: DropTarget;
  /** A control that opens the target without dropping — a tree row's disclosure, say. */
  activateButtonRef?: ShallowRef<HTMLElement | null>;
}

export interface UseDroppableItemReturn {
  attrs: ComputedRef<{"aria-describedby"?: string; "aria-hidden"?: "true"}>;
  handlers: {onClick: () => void};
  isDropTarget: ComputedRef<boolean>;
}

/**
 * Drop behaviour for one item of a collection, ported from React Aria's `useDroppableItem`.
 *
 * Registers the item with the keyboard drag session so Tab can reach it, and hides it from
 * assistive technology while a drag it cannot accept is in flight — otherwise a screen reader
 * user would tab through targets that will refuse them.
 */
export const useDroppableItem = (
  options: UseDroppableItemOptions,
  state: UseDroppableCollectionStateReturn<unknown>,
  element: ShallowRef<HTMLElement | null>,
): UseDroppableItemReturn => {
  const virtual = useVirtualDrop();
  const session = useDragSession();
  const collectionElement = getDroppableCollectionElement(state);

  watch(
    [element, () => options.target],
    ([node], _previous, onCleanup) => {
      if (!node) return;

      onCleanup(
        registerDropItem({
          activateButtonRef: options.activateButtonRef,
          element: node,
          getDropOperation: (types, allowedOperations) =>
            state.getDropOperation({
              allowedOperations,
              draggingKeys: globalDndState.draggingKeys,
              isInternal: isInternalDropOperation(collectionElement),
              target: options.target,
              types: {has: (type) => types.has(type as string)},
            }),
          target: options.target,
        }),
      );
    },
    {immediate: true},
  );

  /** Whether the drag in flight could actually land here. */
  const isValidDropTarget = computed(() => {
    const dragSession = session.value;

    if (!dragSession) return false;

    return (
      state.getDropOperation({
        allowedOperations: dragSession.dragTarget.allowedDropOperations,
        draggingKeys: globalDndState.draggingKeys,
        isInternal: isInternalDropOperation(collectionElement),
        target: options.target,
        types: {
          has: (type) => getTypes(dragSession.dragTarget.items).has(type as string),
        },
      }) !== "cancel"
    );
  });

  const isDropTarget = computed(() => state.isDropTarget(options.target));

  // The session moves focus between targets; an item that becomes the target has to take it.
  watch([isDropTarget, session], ([isTarget, dragSession]) => {
    if (isTarget && dragSession) element.value?.focus();
  });

  return {
    attrs: computed(() => ({
      ...virtual.attrs.value,
      // Only hidden during a drag it would refuse — outside a drag it is an ordinary item.
      ...(session.value && !isValidDropTarget.value ? {"aria-hidden": "true" as const} : {}),
    })),
    handlers: virtual.handlers,
    isDropTarget,
  };
};
