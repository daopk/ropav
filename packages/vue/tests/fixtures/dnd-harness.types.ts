import type {UseDragOptions, UseDragReturn} from "@/composables/use-drag";
import type {UseDropOptions, UseDropReturn} from "@/composables/use-drop";

/**
 * What the drag and drop harnesses hand back.
 *
 * `useDrag` and `useDrop` both resolve a locale, and resolving one means injecting a context —
 * which only works inside a component. An `effectScope` is not one, so these composables have to
 * be exercised through a mounted harness rather than called directly.
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
