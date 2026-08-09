import type {CollectionKey, UseCollectionReturn} from "../../composables/use-collection";
import type {DragAndDropHooks} from "../../composables/use-drag-and-drop";
import type {UseDraggableCollectionStateReturn} from "../../composables/use-draggable-collection-state";
import type {UseDroppableCollectionStateReturn} from "../../composables/use-droppable-collection-state";
import type {UseListKeyboardReturn} from "../../composables/use-list-keyboard";
import type {UseSelectionManagerReturn} from "../../composables/use-selection-manager";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ListBoxContext {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  keyboard: UseListKeyboardReturn;
  /** The listbox's own id, which item ids are derived from. */
  listId: ComputedRef<string>;
  /** Shared marker so an item can tell which collection it belongs to. */
  collectionId: ComputedRef<string>;
  /** Called when an item is activated rather than selected. */
  onAction?: (key: CollectionKey) => void;
  /**
   * The drag and drop configuration, when there is any.
   *
   * Items read the hooks from here rather than importing them, so a listbox without drag and
   * drop leaves the whole layer out of the bundle.
   */
  dragAndDropHooks?: DragAndDropHooks;
  dragState?: UseDraggableCollectionStateReturn<unknown>;
  dropState?: UseDroppableCollectionStateReturn<unknown>;
}

/**
 * Strict: an item, section or indicator outside a listbox has no collection to join and no
 * selection to read, so it would render something that looks interactive but is not.
 */
export const [useListBoxContext, provideListBoxContext] = createContext<ListBoxContext>({
  name: "ListBoxContext",
});
