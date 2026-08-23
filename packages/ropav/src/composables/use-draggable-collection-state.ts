import type {
  DragCollection,
  DragItem,
  DragKey,
  DragMoveEvent,
  DragPreviewRenderer,
  DragStartEvent,
  DraggableCollectionEndEvent,
  DraggableCollectionMoveEvent,
  DraggableCollectionStartEvent,
  DropOperation,
} from "../utils/dnd-types";
import type {UseSelectionManagerReturn} from "./use-selection-manager";
import type {ComputedRef, MaybeRefOrGetter, ShallowRef} from "vue";

import {computed, shallowRef, toValue} from "vue";

export interface UseDraggableCollectionStateOptions<T = unknown> {
  collection: DragCollection<T>;
  selectionManager: UseSelectionManagerReturn;
  /** Builds the drag items for the keys being dragged, given their values. */
  getItems: (keys: Set<DragKey>, items: T[]) => DragItem[];
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  onDragStart?: (event: DraggableCollectionStartEvent) => void;
  onDragMove?: (event: DraggableCollectionMoveEvent) => void;
  onDragEnd?: (event: DraggableCollectionEndEvent) => void;
  preview?: ShallowRef<DragPreviewRenderer | null>;
  getAllowedDropOperations?: () => DropOperation[];
}

export interface UseDraggableCollectionStateReturn<T = unknown> {
  collection: DragCollection<T>;
  selectionManager: UseSelectionManagerReturn;
  /** The item the drag was started from. */
  draggedKey: ComputedRef<DragKey | null>;
  /** Every key travelling with the drag, which may be a whole selection. */
  draggingKeys: ComputedRef<Set<DragKey>>;
  isDisabled: ComputedRef<boolean>;
  isDragging: (key: DragKey) => boolean;
  getKeysForDrag: (key: DragKey) => Set<DragKey>;
  getItems: (key: DragKey) => DragItem[];
  preview?: ShallowRef<DragPreviewRenderer | null>;
  getAllowedDropOperations?: () => DropOperation[];
  startDrag: (key: DragKey, event: DragStartEvent) => void;
  moveDrag: (event: DragMoveEvent) => void;
  endDrag: (event: DraggableCollectionEndEvent) => void;
}

/**
 * Drag state for a collection, ported from react-stately's `useDraggableCollectionState`.
 *
 * Owns the one question the drag layer cannot answer for itself: given the item the user grabbed,
 * which items actually travel with it.
 */
export const useDraggableCollectionState = <T = unknown>(
  options: UseDraggableCollectionStateOptions<T>,
): UseDraggableCollectionStateReturn<T> => {
  const {collection, selectionManager} = options;
  const draggingKeys = shallowRef<Set<DragKey>>(new Set());
  const draggedKey = shallowRef<DragKey | null>(null);

  /**
   * Which keys travel with a drag started from this one.
   *
   * Dragging an item that is part of the selection drags the whole selection; dragging an
   * unselected item drags only that item, leaving the selection alone. This is what macOS does,
   * and doing otherwise would make a drag silently act on items the user cannot see.
   *
   * Descendants of another selected item are dropped from the set: moving a folder already moves
   * everything inside it, and including both would move the children twice.
   */
  const getKeysForDrag = (key: DragKey): Set<DragKey> => {
    const keys = new Set<DragKey>();

    if (!selectionManager.isSelected(key)) {
      keys.add(key);

      return keys;
    }

    const selected = selectionManager.selectedKeys.value;

    for (const currentKey of selected) {
      const node = collection.getItem(currentKey);

      if (!node) continue;

      let isDescendantOfSelected = false;
      let parentKey = node.parentKey ?? null;

      while (parentKey != null) {
        if (selected.has(parentKey)) {
          isDescendantOfSelected = true;
          break;
        }

        parentKey = collection.getItem(parentKey)?.parentKey ?? null;
      }

      if (!isDescendantOfSelected) keys.add(currentKey);
    }

    return keys;
  };

  return {
    collection,
    draggedKey: computed(() => draggedKey.value),
    draggingKeys: computed(() => draggingKeys.value),
    endDrag(event) {
      options.onDragEnd?.({...event, isInternal: event.isInternal, keys: draggingKeys.value});

      draggingKeys.value = new Set();
      draggedKey.value = null;
    },
    getAllowedDropOperations: options.getAllowedDropOperations,
    getItems(key) {
      const keys = getKeysForDrag(key);
      const values: T[] = [];

      for (const currentKey of keys) {
        const value = collection.getItem(currentKey)?.value;

        if (value != null) values.push(value);
      }

      return options.getItems(keys, values);
    },
    getKeysForDrag,
    isDisabled: computed(() => Boolean(toValue(options.isDisabled))),
    isDragging: (key) => draggingKeys.value.has(key),
    moveDrag(event) {
      options.onDragMove?.({...event, keys: draggingKeys.value});
    },
    preview: options.preview,
    selectionManager,
    startDrag(key, event) {
      const keys = getKeysForDrag(key);

      draggingKeys.value = keys;
      draggedKey.value = key;
      // Focus belongs to the drag session from here on; leaving the collection focused would
      // paint a focus ring on an item the user is no longer navigating.
      selectionManager.setFocused(false);
      options.onDragStart?.({...event, keys});
    },
  };
};
