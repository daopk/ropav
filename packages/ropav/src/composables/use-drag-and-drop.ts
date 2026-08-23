import type {
  DragItem,
  DragKey,
  DragPreviewRenderer,
  DragType,
  DragTypes,
  DraggableCollectionEndEvent,
  DraggableCollectionStartEvent,
  DropOperation,
  DropTarget,
  DropTargetDelegate,
  DroppableCollectionActivateEvent,
  DroppableCollectionDropEvent,
  DroppableCollectionInsertDropEvent,
  DroppableCollectionOnItemDropEvent,
  DroppableCollectionReorderEvent,
  DroppableCollectionRootDropEvent,
  ItemDropTarget,
} from "../utils/dnd-types";
import type { MaybeRefOrGetter } from "vue";

import { ListDropTargetDelegate } from "../utils/dnd-list-drop-target-delegate";

import { isVirtualDragging } from "./drag-manager";
import { useDraggableCollection } from "./use-draggable-collection";
import { useDraggableCollectionState } from "./use-draggable-collection-state";
import { useDraggableItem } from "./use-draggable-item";
import { useDropIndicator } from "./use-drop-indicator";
import { useDroppableCollection } from "./use-droppable-collection";
import { useDroppableCollectionState } from "./use-droppable-collection-state";
import { useDroppableItem } from "./use-droppable-item";

export interface DragAndDropOptions {
  /* -- Dragging -------------------------------------------------------------------------- */

  /**
   * The items to put on the drag, for the keys being dragged.
   *
   * Supplying this is what makes the collection draggable at all.
   */
  getItems?: (keys: Set<DragKey>) => DragItem[];
  /** A custom drag image. Without one the browser drags a picture of the rows themselves. */
  renderDragPreview?: DragPreviewRenderer;
  getAllowedDropOperations?: () => DropOperation[];
  onDragStart?: (event: DraggableCollectionStartEvent) => void;
  onDragEnd?: (event: DraggableCollectionEndEvent) => void;

  /* -- Dropping -------------------------------------------------------------------------- */

  /** Items from elsewhere dropped between two rows. */
  onInsert?: (event: DroppableCollectionInsertDropEvent) => void;
  /** Items from elsewhere dropped on the collection itself. */
  onRootDrop?: (event: DroppableCollectionRootDropEvent) => void;
  /** Items dropped onto a row rather than between two. */
  onItemDrop?: (event: DroppableCollectionOnItemDropEvent) => void;
  /** Rows of this collection moved between siblings. */
  onReorder?: (event: DroppableCollectionReorderEvent) => void;
  /** Rows of this collection moved anywhere, including onto a row or across parents. */
  onMove?: (event: DroppableCollectionReorderEvent) => void;
  /** Replaces every handler above, for a caller that wants to route drops itself. */
  onDrop?: (event: DroppableCollectionDropEvent) => void;
  onDropActivate?: (event: DroppableCollectionActivateEvent) => void;
  acceptedDragTypes?: "all" | DragType[];
  shouldAcceptItemDrop?: (target: ItemDropTarget, types: DragTypes) => boolean;
  getDropOperation?: (
    target: DropTarget,
    types: DragTypes,
    allowedOperations: DropOperation[],
  ) => DropOperation;
  /** Resolves a pointer position to a drop target. The collection supplies one by default. */
  dropTargetDelegate?: DropTargetDelegate;

  /** Suppresses both halves. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * The hooks a collection reaches for, present only when the caller asked for that half.
 *
 * Handing the collection a bag of functions rather than importing them there is React Aria's
 * shape, and it earns its keep for the same reason: a `ListBox` with no drag and drop never
 * mentions these modules, so none of it reaches the bundle.
 */
export interface DragAndDropHooks {
  options: DragAndDropOptions;
  useDraggableCollectionState?: typeof useDraggableCollectionState;
  useDraggableCollection?: typeof useDraggableCollection;
  useDraggableItem?: typeof useDraggableItem;
  useDroppableCollectionState?: typeof useDroppableCollectionState;
  useDroppableCollection?: typeof useDroppableCollection;
  useDroppableItem?: typeof useDroppableItem;
  useDropIndicator?: typeof useDropIndicator;
  ListDropTargetDelegate?: typeof ListDropTargetDelegate;
  isVirtualDragging?: typeof isVirtualDragging;
  renderDragPreview?: DragPreviewRenderer;
  dropTargetDelegate?: DropTargetDelegate;
}

export interface UseDragAndDropReturn {
  dragAndDropHooks: DragAndDropHooks;
}

/**
 * Configures drag and drop for a collection.
 *
 * Which halves are switched on is inferred from the handlers given, rather than from a flag: a
 * collection is draggable when it can say what its items *are*, and droppable when there is
 * something it could do with what arrives. Declaring neither and still passing this in would be
 * a no-op, so there is nothing to get out of step.
 */
export const useDragAndDrop = (options: DragAndDropOptions): UseDragAndDropReturn => {
  const isDraggable = Boolean(options.getItems);
  const isDroppable = Boolean(
    options.onDrop ??
    options.onInsert ??
    options.onItemDrop ??
    options.onReorder ??
    options.onMove ??
    options.onRootDrop,
  );

  const hooks: DragAndDropHooks = { options };

  if (isDraggable) {
    hooks.useDraggableCollectionState = useDraggableCollectionState;
    hooks.useDraggableCollection = useDraggableCollection;
    hooks.useDraggableItem = useDraggableItem;
    hooks.renderDragPreview = options.renderDragPreview;
    hooks.isVirtualDragging = isVirtualDragging;
  }

  if (isDroppable) {
    hooks.useDroppableCollectionState = useDroppableCollectionState;
    hooks.useDroppableCollection = useDroppableCollection;
    hooks.useDroppableItem = useDroppableItem;
    hooks.useDropIndicator = useDropIndicator;
    hooks.ListDropTargetDelegate = ListDropTargetDelegate;
    hooks.dropTargetDelegate = options.dropTargetDelegate;
  }

  return { dragAndDropHooks: hooks };
};
