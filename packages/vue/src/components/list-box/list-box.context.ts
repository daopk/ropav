import type {CollectionKey, UseCollectionReturn} from "../../composables/use-collection";
import type {DragAndDropHooks} from "../../composables/use-drag-and-drop";
import type {UseDraggableCollectionStateReturn} from "../../composables/use-draggable-collection-state";
import type {UseDroppableCollectionStateReturn} from "../../composables/use-droppable-collection-state";
import type {UseListKeyboardReturn} from "../../composables/use-list-keyboard";
import type {FocusStrategy} from "../../composables/use-overlay-trigger-state";
import type {UseSelectionManagerReturn} from "../../composables/use-selection-manager";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

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
   * Whether hovering an option moves focus to it.
   *
   * Off for a listbox standing on its own, on for one inside a picker: there the pointer and the
   * keyboard drive the same single choice, so the highlight has to follow the mouse or the next
   * arrow press would jump back to wherever the keyboard left off.
   */
  shouldFocusOnHover: ComputedRef<boolean>;
  /**
   * Whether focus over the options is nominal rather than real.
   *
   * An option cannot read its focus off focus events then — nothing inside ever receives one —
   * so the focused key is what it has to draw its ring from.
   */
  shouldUseVirtualFocus: ComputedRef<boolean>;
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

export interface ListBoxStateContext {
  /** The collection the listbox navigates over, owned by whatever provided this. */
  collection: UseCollectionReturn;
  /** The selection the listbox reads and writes. */
  selection: UseSelectionManagerReturn;
  /** The listbox's id, so the owner's trigger can point `aria-controls` at it. */
  listId?: MaybeRefOrGetter<string | undefined>;
  /** Id of the element naming the listbox, normally the owner's label. */
  labelledBy?: MaybeRefOrGetter<string | undefined>;
  /** Where focus lands when the listbox appears, given how its owner was opened. */
  autoFocus?: MaybeRefOrGetter<boolean | FocusStrategy | undefined>;
  /** Whether hovering an option moves focus to it. @default false */
  shouldFocusOnHover?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Whether focus over the options is nominal, because a control beside the listbox holds the
   * caret and names the focused option with `aria-activedescendant`.
   * @default false
   */
  shouldUseVirtualFocus?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Handed the listbox's keyboard behaviour once the listbox exists, and `null` when it goes away.
   *
   * The counterpart of virtual focus: the owner is the one holding the control the arrows are
   * pressed in, so it needs the behaviour that answers them — but only the listbox can build it,
   * because only the listbox knows its own element and its own layout. That is what makes paging
   * and virtualized paging work from outside instead of falling back to the ends of the list.
   */
  registerKeyboard?: (keyboard: UseListKeyboardReturn | null) => void;
}

/**
 * A listbox whose state belongs to something above it.
 *
 * A picker owns the collection and the selection because it has to answer for them while the
 * listbox does not exist — the value in its trigger, the options in its hidden native control.
 * Handing that state down mirrors what React Aria does with `ListStateContext`, and it is what
 * lets the same `ListBox` component serve both cases.
 *
 * Optional, and absent is the ordinary case: a listbox on its own owns everything it needs.
 */
export const [useListBoxStateContext, provideListBoxStateContext] =
  createContext<ListBoxStateContext | null>({
    defaultValue: null,
    name: "ListBoxStateContext",
    strict: false,
  });
