import type {DragKey} from "../utils/dnd-types";
import type {UseDroppableCollectionStateReturn} from "./use-droppable-collection-state";
import type {UseDroppableItemOptions} from "./use-droppable-item";
import type {ComputedRef, ShallowRef} from "vue";

import {computed, useId} from "vue";

import {dndStrings} from "../i18n/dnd";

import {useDragSession} from "./drag-manager";
import {getDroppableCollectionId} from "./droppable-collection-registry";
import {useDroppableItem} from "./use-droppable-item";
import {useLocalizedStringFormatter} from "./use-localized-string-formatter";

export type UseDropIndicatorOptions = UseDroppableItemOptions;

export interface UseDropIndicatorReturn {
  attrs: ComputedRef<Record<string, unknown>>;
  handlers: {onClick: () => void};
  isDropTarget: ComputedRef<boolean>;
  /**
   * Whether the indicator should not be rendered at all.
   *
   * Distinct from "not the current target": an indicator that is merely inactive still has to
   * exist so a keyboard user can Tab onto it. This is true only when it is neither active nor
   * reachable, which is the case outside a keyboard drag entirely.
   */
  isHidden: ComputedRef<boolean>;
}

/**
 * The accessible half of a drop indicator, ported from React Aria's `useDropIndicator`.
 *
 * A gap between two rows has nothing to read out, so the label is built from the items on either
 * side of it — "Insert between Ada and Grace". That is the whole reason this exists separately
 * from `useDroppableItem`.
 */
export const useDropIndicator = (
  options: UseDropIndicatorOptions,
  state: UseDroppableCollectionStateReturn<unknown>,
  element: ShallowRef<HTMLElement | null>,
): UseDropIndicatorReturn => {
  const stringFormatter = useLocalizedStringFormatter(dndStrings);
  const session = useDragSession();
  const droppableItem = useDroppableItem(options, state, element);
  const id = useId();

  const textOf = (key: DragKey | null | undefined): string =>
    key == null ? "" : (state.collection.getItem(key)?.textValue ?? "");

  const label = computed(() => {
    const {target} = options;

    if (target.type === "root") return stringFormatter.value.format("dropOnRoot");

    if (target.dropPosition === "on") {
      return stringFormatter.value.format("dropOnItem", {itemText: textOf(target.key)});
    }

    // A gap is named by what sits on either side of it. One side is the target itself; the other
    // is its neighbour, which may not exist at the ends of the list.
    let before: DragKey | null;
    let after: DragKey | null;

    if (target.dropPosition === "before") {
      const prevKey = state.collection.getItem(target.key)?.prevKey;
      const prevNode = prevKey != null ? state.collection.getItem(prevKey) : null;

      before = (prevNode?.type ?? "item") === "item" ? (prevNode?.key ?? null) : null;
    } else {
      before = target.key;
    }

    if (target.dropPosition === "after") {
      const nextKey = state.collection.getItem(target.key)?.nextKey;
      const nextNode = nextKey != null ? state.collection.getItem(nextKey) : null;

      after = (nextNode?.type ?? "item") === "item" ? (nextNode?.key ?? null) : null;
    } else {
      after = target.key;
    }

    if (before != null && after != null) {
      return stringFormatter.value.format("insertBetween", {
        afterItemText: textOf(after),
        beforeItemText: textOf(before),
      });
    }

    if (before != null) {
      return stringFormatter.value.format("insertAfter", {itemText: textOf(before)});
    }

    if (after != null) {
      return stringFormatter.value.format("insertBefore", {itemText: textOf(after)});
    }

    return "";
  });

  /** Outside a drag there is nothing to indicate, so the element is hidden wholesale. */
  const ariaHidden = computed(() =>
    session.value ? droppableItem.attrs.value["aria-hidden"] : ("true" as const),
  );

  return {
    attrs: computed(() => ({
      ...droppableItem.attrs.value,
      "aria-hidden": ariaHidden.value,
      "aria-label": label.value,
      // The root indicator is additionally labelled by the collection it stands for.
      "aria-labelledby":
        options.target.type === "root" ? `${id} ${getDroppableCollectionId(state)}` : undefined,
      "aria-roledescription": stringFormatter.value.format("dropIndicator"),
      id,
      tabindex: -1,
    })),
    handlers: droppableItem.handlers,
    isDropTarget: droppableItem.isDropTarget,
    isHidden: computed(() => !droppableItem.isDropTarget.value && Boolean(ariaHidden.value)),
  };
};
