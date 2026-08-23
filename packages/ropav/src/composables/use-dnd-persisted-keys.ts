import type { CollectionKey } from "./use-collection";
import type { DragAndDropHooks } from "./use-drag-and-drop";
import type { UseDroppableCollectionStateReturn } from "./use-droppable-collection-state";
import type { ComputedRef } from "vue";

import { computed } from "vue";

/**
 * The keys a virtualized collection has to keep rendered while a drag is in flight, ported from
 * React Aria Components' `useDndPersistedKeys`.
 *
 * A windowed collection only renders what is on screen, and during a **keyboard or screen reader**
 * drag that is not enough: the drop target is reached by pressing a key rather than by pointing
 * at something, so it can be a row nobody has scrolled to, and its element has to exist for focus
 * to move onto it. A pointer drag needs none of this — you cannot point at a row that is not on
 * screen — which is why the whole thing is conditional on `isVirtualDragging`.
 *
 * The focused key is kept for the reason it always is: the roving tab stop lives on it.
 */
export const useDndPersistedKeys = (
  focusedKey: () => CollectionKey | null,
  dragAndDropHooks?: DragAndDropHooks,
  dropState?: UseDroppableCollectionStateReturn<unknown>,
): ComputedRef<Set<CollectionKey>> =>
  computed(() => {
    const keys = new Set<CollectionKey>();
    const focused = focusedKey();

    if (focused != null) keys.add(focused);

    const target = dropState?.target.value;

    if (!dropState || !dragAndDropHooks?.isVirtualDragging?.() || target?.type !== "item") {
      return keys;
    }

    /**
     * Normalised to the row the indicator is rendered against.
     *
     * "After A" is drawn by whatever follows A, so persisting A itself would keep the wrong row
     * alive and leave the indicator with nothing to attach to. Upstream additionally steps over
     * the target's descendants here; a windowed collection is built from flat data in this build,
     * so there are none to step over.
     */
    if (target.dropPosition === "after") {
      const nextKey = dropState.collection.getKeyAfter(target.key);

      keys.add((nextKey ?? target.key) as CollectionKey);
    } else {
      keys.add(target.key as CollectionKey);
    }

    return keys;
  });
