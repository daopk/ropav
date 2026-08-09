import type {UseDragOptions, UseDragReturn} from "@/composables/use-drag";
import type {UseDropOptions, UseDropReturn} from "@/composables/use-drop";
import type {UseDropIndicatorReturn} from "@/composables/use-drop-indicator";
import type {
  DroppableCollectionKeyboardDelegate,
  UseDroppableCollectionOptions,
  UseDroppableCollectionReturn,
} from "@/composables/use-droppable-collection";
import type {
  UseDroppableCollectionStateOptions,
  UseDroppableCollectionStateReturn,
} from "@/composables/use-droppable-collection-state";
import type {UseSelectionManagerReturn} from "@/composables/use-selection-manager";
import type {DragCollection, DropTarget, DropTargetDelegate} from "@/utils/dnd-types";

/**
 * What the drag and drop harnesses hand back.
 *
 * Every one of these composables resolves a locale, and resolving one means injecting a context —
 * which only works inside a component. An `effectScope` is not one, so they have to be exercised
 * through a mounted harness rather than called directly.
 */
export interface DragHarnessReady extends UseDragReturn {
  element: HTMLElement;
}

export interface DropHarnessReady extends UseDropReturn {
  element: HTMLElement;
}

export type DragHarnessOptions = Omit<UseDragOptions, "getItems"> &
  Partial<Pick<UseDragOptions, "getItems">>;

export type DropHarnessOptions = Omit<UseDropOptions, "ref">;

/* -------------------------------------------------------------------------------------------------
 * Droppable collection
 * -----------------------------------------------------------------------------------------------*/

export interface DroppableCollectionHarnessOptions {
  collection: DragCollection<unknown>;
  selectionManager: UseSelectionManagerReturn;
  dropTargetDelegate: DropTargetDelegate;
  keyboardDelegate: DroppableCollectionKeyboardDelegate;
  /** Which position the harness's single drop indicator stands for. */
  indicatorTarget: DropTarget;
  /** Handlers and options shared by the state and the collection hook. */
  state?: Partial<UseDroppableCollectionStateOptions<unknown>> & {
    onDropActivate?: UseDroppableCollectionOptions["onDropActivate"];
    onKeyDown?: (event: KeyboardEvent) => void;
  };
}

export interface DroppableCollectionHarnessReady {
  collection: UseDroppableCollectionReturn;
  indicator: UseDropIndicatorReturn;
  state: UseDroppableCollectionStateReturn<unknown>;
  element: HTMLElement;
}
