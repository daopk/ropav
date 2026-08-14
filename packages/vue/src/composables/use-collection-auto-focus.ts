import type {CollectionKey} from "./use-collection";
import type {UseListKeyboardReturn} from "./use-list-keyboard";
import type {FocusStrategy} from "./use-overlay-trigger-state";
import type {UseSelectionManagerReturn} from "./use-selection-manager";
import type {MaybeRefOrGetter, ShallowRef} from "vue";

import {nextTick, toValue, watch} from "vue";

export interface UseCollectionAutoFocusOptions {
  /** The element carrying the collection role, which takes focus when no item does. */
  element: ShallowRef<HTMLElement | null>;
  keyboard: UseListKeyboardReturn;
  selection: UseSelectionManagerReturn;
  /**
   * Where focus lands when the collection appears. `"first"`/`"last"` pick an end, `true` focuses
   * the collection itself, and a selected item wins over any of them.
   */
  autoFocus?: MaybeRefOrGetter<boolean | FocusStrategy | undefined>;
}

/**
 * Move focus in once, when a collection inside an overlay appears.
 *
 * A selected item wins over the requested end of the list, because reopening a list of choices on
 * the choice already made is where the user left off. With nothing selected and no end asked for,
 * the collection itself takes focus — that is what makes the first arrow press start from the top
 * rather than from wherever focus happened to be.
 *
 * Shared by the menu and by a listbox driven from above, which are the two collections that appear
 * already open and so have to place focus for themselves.
 *
 * @example
 * ```ts
 * useCollectionAutoFocus({autoFocus: () => target.autoFocus.value, element, keyboard, selection});
 * ```
 */
export const useCollectionAutoFocus = (options: UseCollectionAutoFocusOptions): void => {
  const {element, keyboard, selection} = options;

  let hasAutoFocused = false;

  watch(
    element,
    (current) => {
      if (!current || hasAutoFocused) return;

      hasAutoFocused = true;

      const autoFocus = toValue(options.autoFocus);

      if (!autoFocus) return;

      // One tick behind the element, because the items register themselves post-flush too and
      // this one is queued first — asking for the first key any sooner asks an empty collection.
      // Still within the same task, so nothing is painted with focus in the wrong place.
      void nextTick(() => {
        // Something already took focus inside while this was waiting — a submenu opened from an
        // item, most plainly — and moving it now would undo what the user just did.
        if (current.contains(current.ownerDocument.activeElement)) return;

        let focusedKey: CollectionKey | null = null;

        if (autoFocus === "first") focusedKey = keyboard.getFirstKey();
        if (autoFocus === "last") focusedKey = keyboard.getLastKey();

        for (const key of selection.selectedKeys.value) {
          if (selection.canSelectItem(key)) {
            focusedKey = key;
            break;
          }
        }

        selection.setFocused(true);

        if (focusedKey == null) current.focus({preventScroll: true});
        else keyboard.focusKey(focusedKey);
      });
    },
    {flush: "post"},
  );
};
