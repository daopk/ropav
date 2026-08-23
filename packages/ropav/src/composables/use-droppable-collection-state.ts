import type {
  DragCollection,
  DragKey,
  DragType,
  DragTypes,
  DropOperation,
  DropTarget,
  DroppableCollectionDropEvent,
  DroppableCollectionEnterEvent,
  DroppableCollectionExitEvent,
  DroppableCollectionInsertDropEvent,
  DroppableCollectionOnItemDropEvent,
  DroppableCollectionReorderEvent,
  DroppableCollectionRootDropEvent,
  ItemDropTarget,
} from "../utils/dnd-types";
import type { UseSelectionManagerReturn } from "./use-selection-manager";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

/** Everything the validity matrix needs to judge one candidate drop. */
export interface DropOperationEvent {
  target: DropTarget;
  types: DragTypes;
  allowedOperations: DropOperation[];
  /** Whether the drag started in this same collection. */
  isInternal: boolean;
  draggingKeys: Set<DragKey>;
}

export interface UseDroppableCollectionStateOptions<T = unknown> {
  collection: DragCollection<T>;
  selectionManager: UseSelectionManagerReturn;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Which drag types this collection will take. `"all"` accepts anything. */
  acceptedDragTypes?: "all" | DragType[];
  onInsert?: (event: DroppableCollectionInsertDropEvent) => void;
  onRootDrop?: (event: DroppableCollectionRootDropEvent) => void;
  onItemDrop?: (event: DroppableCollectionOnItemDropEvent) => void;
  /** Reordering within one parent. Between items only, never onto one. */
  onReorder?: (event: DroppableCollectionReorderEvent) => void;
  /** Moving within the collection, including onto an item and across parents. */
  onMove?: (event: DroppableCollectionReorderEvent) => void;
  shouldAcceptItemDrop?: (target: ItemDropTarget, types: DragTypes) => boolean;
  onDropEnter?: (event: DroppableCollectionEnterEvent) => void;
  onDropExit?: (event: DroppableCollectionExitEvent) => void;
  /** When given, this replaces the specific handlers above rather than adding to them. */
  onDrop?: (event: DroppableCollectionDropEvent) => void;
  getDropOperation?: (
    target: DropTarget,
    types: DragTypes,
    allowedOperations: DropOperation[],
  ) => DropOperation;
}

export interface UseDroppableCollectionStateReturn<T = unknown> {
  collection: DragCollection<T>;
  selectionManager: UseSelectionManagerReturn;
  isDisabled: ComputedRef<boolean>;
  target: ComputedRef<DropTarget | null>;
  setTarget: (target: DropTarget | null) => void;
  isDropTarget: (target: DropTarget | null) => boolean;
  getDropOperation: (event: DropOperationEvent) => DropOperation;
}

const isEqualDropTarget = (a?: DropTarget | null, b?: DropTarget | null): boolean => {
  if (!a) return !b;

  if (a.type === "root") return b?.type === "root";

  return b?.type === "item" && b.key === a.key && b.dropPosition === a.dropPosition;
};

/**
 * Whether every dragged item shares the target's parent.
 *
 * Reordering is defined as rearranging siblings; a drag that spans two parents is a move, and
 * `onReorder` must not be offered for it.
 */
const isDraggingWithinParent = <T>(
  collection: DragCollection<T>,
  target: ItemDropTarget,
  draggingKeys: Set<DragKey>,
): boolean => {
  const targetParent = collection.getItem(target.key)?.parentKey ?? null;

  for (const key of draggingKeys) {
    if ((collection.getItem(key)?.parentKey ?? null) !== targetParent) return false;
  }

  return true;
};

/**
 * Drop state for a collection, ported from react-stately's `useDroppableCollectionState`.
 *
 * Holds the current drop target and decides, for any candidate, which operation — if any — the
 * collection would perform. The decision is driven by **which handlers the caller supplied**: a
 * collection with only `onReorder` refuses a drag from elsewhere, because there is nothing it
 * could do with it.
 */
export const useDroppableCollectionState = <T = unknown>(
  options: UseDroppableCollectionStateOptions<T>,
): UseDroppableCollectionStateReturn<T> => {
  const { collection, selectionManager } = options;
  const target = shallowRef<DropTarget | null>(null);
  const isDisabled = () => Boolean(toValue(options.isDisabled));

  /**
   * The same gap named from the other side.
   *
   * "After item 2" and "before item 3" are one position, and the pointer and keyboard paths do
   * not agree on which name to use, so both have to compare equal.
   */
  const getOppositeTarget = (candidate: ItemDropTarget): ItemDropTarget | null => {
    const node = collection.getItem(candidate.key);

    if (!node) return null;

    if (candidate.dropPosition === "before") {
      return node.prevKey != null
        ? { dropPosition: "after", key: node.prevKey, type: "item" }
        : null;
    }

    if (candidate.dropPosition === "after") {
      return node.nextKey != null
        ? { dropPosition: "before", key: node.nextKey, type: "item" }
        : null;
    }

    return null;
  };

  const isDropTarget = (candidate: DropTarget | null): boolean => {
    const current = target.value;

    if (!current || !candidate) return false;
    if (isEqualDropTarget(candidate, current)) return true;

    // Two names for one gap between adjacent items.
    if (
      candidate.type === "item" &&
      current.type === "item" &&
      candidate.key !== current.key &&
      candidate.dropPosition !== current.dropPosition &&
      candidate.dropPosition !== "on" &&
      current.dropPosition !== "on"
    ) {
      return (
        isEqualDropTarget(getOppositeTarget(candidate), current) ||
        isEqualDropTarget(candidate, getOppositeTarget(current))
      );
    }

    return false;
  };

  /** Which operation the collection would perform, judged by the handlers it was given. */
  const defaultGetDropOperation = (event: DropOperationEvent): DropOperation => {
    const { allowedOperations, draggingKeys, isInternal, target: candidate } = event;
    const types = event.types;
    const accepted = options.acceptedDragTypes ?? "all";

    if (isDisabled() || !candidate) return "cancel";

    if (accepted !== "all" && !accepted.some((type) => types.has(type))) return "cancel";

    const isBetween =
      candidate.type === "item" &&
      (candidate.dropPosition === "before" || candidate.dropPosition === "after");

    const isValidInsert = Boolean(options.onInsert) && isBetween && !isInternal;
    const isValidReorder =
      Boolean(options.onReorder) &&
      isBetween &&
      isInternal &&
      isDraggingWithinParent(collection, candidate as ItemDropTarget, draggingKeys);

    // A caller may refuse a drop onto a particular item — a file onto a file, say.
    const isItemDropAllowed =
      candidate.type !== "item" ||
      candidate.dropPosition !== "on" ||
      !options.shouldAcceptItemDrop ||
      options.shouldAcceptItemDrop(candidate, types);

    const isValidMove =
      Boolean(options.onMove) && candidate.type === "item" && isInternal && isItemDropAllowed;

    // Dropping a collection's own items onto its root reads as a no-op, so it is refused.
    const isValidRootDrop = Boolean(options.onRootDrop) && candidate.type === "root" && !isInternal;

    const isValidOnItemDrop =
      Boolean(options.onItemDrop) &&
      candidate.type === "item" &&
      candidate.dropPosition === "on" &&
      !(isInternal && candidate.key != null && draggingKeys.has(candidate.key)) &&
      isItemDropAllowed;

    const isValid =
      Boolean(options.onDrop) ||
      isValidInsert ||
      isValidReorder ||
      isValidMove ||
      isValidRootDrop ||
      isValidOnItemDrop;

    if (!isValid) return "cancel";

    return options.getDropOperation
      ? options.getDropOperation(candidate, types, allowedOperations)
      : (allowedOperations[0] ?? "cancel");
  };

  return {
    collection,
    getDropOperation(event) {
      const { draggingKeys, isInternal, target: candidate } = event;

      // An item cannot be dropped onto itself, nor into anything it contains — that would
      // detach a subtree and reparent it under a node that is travelling with it.
      if (isInternal && candidate.type === "item" && draggingKeys.size > 0) {
        if (draggingKeys.has(candidate.key) && candidate.dropPosition === "on") return "cancel";

        let currentKey: DragKey | null = candidate.key;

        while (currentKey != null) {
          const parentKey: DragKey | null = collection.getItem(currentKey)?.parentKey ?? null;

          if (parentKey != null && draggingKeys.has(parentKey)) return "cancel";

          currentKey = parentKey;
        }
      }

      return defaultGetDropOperation(event);
    },
    isDisabled: computed(() => isDisabled()),
    isDropTarget,
    selectionManager,
    setTarget(newTarget) {
      if (isDropTarget(newTarget)) return;

      const current = target.value;

      // Coordinates are not known here — the state layer is told which target, not where the
      // pointer is — so they are reported as the origin, as upstream does.
      if (current) options.onDropExit?.({ target: current, type: "dropexit", x: 0, y: 0 });

      if (newTarget) options.onDropEnter?.({ target: newTarget, type: "dropenter", x: 0, y: 0 });

      target.value = newTarget ?? null;
    },
    target: computed(() => target.value),
  };
};
