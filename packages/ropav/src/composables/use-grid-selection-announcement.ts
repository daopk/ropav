import type { CollectionKey, UseCollectionReturn } from "./use-collection";
import type { CollectionSelection, UseSelectionManagerReturn } from "./use-selection-manager";

import { watch } from "vue";

import { announce } from "../utils/live-announcer";

export interface UseGridSelectionAnnouncementOptions {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
}

/** The keys in `a` that `b` does not have. A select-all is not a diff anyone can name. */
const diffSelection = (a: CollectionSelection, b: CollectionSelection): Set<CollectionKey> => {
  if (a === "all" || b === "all") return new Set();

  return new Set([...a].filter((key) => !b.has(key)));
};

const countMessage = (count: number) => {
  if (count === 0) return "No items selected.";

  return count === 1 ? "1 item selected." : `${count} items selected.`;
};

/**
 * Announce selection changes in a grid, ported from React Aria's
 * `useGridSelectionAnnouncement`.
 *
 * This exists because most screen readers say nothing when a row in a grid is selected or
 * deselected — the row's name is read, but the state change that just happened is not. Naming
 * the row and then the running total is what makes a multi-row selection followable.
 *
 * Nothing is announced while focus is outside the grid: a selection restored from props, or one
 * changed by something else on the page, is not this grid reporting its own news.
 */
export const useGridSelectionAnnouncement = (
  options: UseGridSelectionAnnouncementOptions,
): void => {
  const { collection, selection } = options;

  let previous: CollectionSelection = selection.rawSelection.value;

  watch(
    () => selection.rawSelection.value,
    (current) => {
      const last = previous;

      previous = current;

      if (!selection.isFocused.value) return;

      const added = diffSelection(current, last);
      const removed = diffSelection(last, current);
      const messages: string[] = [];

      const nameOf = (key: CollectionKey) => collection.getItem(key)?.textValue() ?? "";

      const single = (key: CollectionKey | undefined, verb: "selected" | "not selected") => {
        if (key == null) return;

        const name = nameOf(key);

        if (name) messages.push(`${name} ${verb}.`);
      };

      // Under `"replace"` a press swaps the whole selection, so the one row left standing is the
      // news — there is no meaningful added-versus-removed to report.
      if (
        selection.selectedKeys.value.size === 1 &&
        selection.selectionBehavior.value === "replace"
      ) {
        single([...selection.selectedKeys.value][0], "selected");
      } else if (added.size === 1 && removed.size === 0) {
        single([...added][0], "selected");
      } else if (removed.size === 1 && added.size === 0) {
        single([...removed][0], "not selected");
      }

      // The running total, except when it would only repeat that the first row was selected.
      if (selection.selectionMode.value === "multiple") {
        const size = current === "all" ? 0 : current.size;
        const lastSize = last === "all" ? 0 : last.size;

        if (
          messages.length === 0 ||
          current === "all" ||
          size > 1 ||
          last === "all" ||
          lastSize > 1
        ) {
          messages.push(
            current === "all"
              ? "All items selected."
              : countMessage(selection.selectedKeys.value.size),
          );
        }
      }

      if (messages.length > 0) announce(messages.join(" "));
    },
  );
};
