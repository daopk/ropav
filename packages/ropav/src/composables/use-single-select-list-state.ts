import type { CollectionKey, UseCollectionReturn } from "./use-collection";
import type { UseSelectionManagerReturn } from "./use-selection-manager";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue, watch } from "vue";

import { useCollection } from "./use-collection";
import { useControllableState } from "./use-controllable-state";
import { useSelectionManager } from "./use-selection-manager";

export interface UseSingleSelectListStateOptions {
  /** The selected item, when the caller drives it. */
  selectedKey?: MaybeRefOrGetter<CollectionKey | undefined>;
  /** The initially selected item. Falls back to the first item that is not disabled. */
  defaultSelectedKey?: CollectionKey;
  onSelectionChange?: (key: CollectionKey) => void;
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  /** Whether the whole list is disabled: a selection that exists but cannot be changed. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseSingleSelectListStateReturn {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  /** The selected item, with the default resolved against the collection. */
  selectedKey: ComputedRef<CollectionKey | null>;
  setSelectedKey: (key: CollectionKey) => void;
  isDisabled: ComputedRef<boolean>;
}

/**
 * Which item of a collection is selected, for a list that always has exactly one.
 *
 * Ported from React Stately's `useSingleSelectListState`
 * (`react-stately/src/list/useSingleSelectListState.ts`, react-stately 3.49.0).
 *
 * "Always exactly one" is `disallowEmptySelection` plus a fallback for the case where nothing says
 * which. The selection behaviour is deliberately left at toggle: whether the arrow keys choose is a
 * question about how activation works, asked by the caller through `selectOnFocus`, not a question
 * about what a press means.
 *
 * The three pieces have to be built in one order — the collection, then the fallback that reads it,
 * then the selection manager the fallback feeds — which is the reason this is a composable rather
 * than a few lines in the root component.
 */
export const useSingleSelectListState = (
  options: UseSingleSelectListStateOptions = {},
): UseSingleSelectListStateReturn => {
  const collection = useCollection();

  const disabledKeySet = computed(() => new Set(toValue(options.disabledKeys) ?? []));

  /**
   * Whether an item can be selected, asked of the collection rather than of the selection manager.
   *
   * Two reasons, and either alone would be enough: the fallback below runs before the manager
   * exists, and React Stately asks the same question the same way — an item's own disabled state
   * or the group's disabled keys, with no `disabledBehavior` in it.
   */
  const isKeyDisabled = (key: CollectionKey) =>
    disabledKeySet.value.has(key) || Boolean(collection.getItem(key)?.isDisabled());

  /** The first item that can be selected, or the first item when none of them can. */
  const findDefaultSelectedKey = (): CollectionKey | null =>
    collection.withOrder(() => {
      let key = collection.getFirstKey();

      while (key != null && isKeyDisabled(key) && key !== collection.getLastKey()) {
        key = collection.getKeyAfter(key);
      }

      // Every item is disabled. The first one reads better than the last.
      if (key != null && isKeyDisabled(key) && key === collection.getLastKey()) {
        key = collection.getFirstKey();
      }

      return key;
    });

  const stored = useControllableState<CollectionKey | null>({
    defaultValue: options.defaultSelectedKey ?? null,
    onValueChange: (key) => {
      if (key != null) options.onSelectionChange?.(key);
    },
    value: () => toValue(options.selectedKey),
  });

  /**
   * The selected item, with the fallback resolved as a read rather than written back.
   *
   * React Stately can resolve it before the first render, because the collection is built by a
   * pass that runs before it. Rendering is what creates the collection here, so writing the
   * fallback into the selection would report a selection change nobody made, on every mount of
   * every uncontrolled list.
   *
   * `collection.size` is read for its own sake: the fallback walks the collection through
   * calls that stay outside reactivity on purpose, so without it this would resolve against the
   * empty collection of the first render and keep that answer.
   */
  const selectedKey = computed<CollectionKey | null>(() => {
    void collection.size.value;

    const key = stored.state.value;

    // Controlled means controlled, even for a key the list does not hold. React Stately gates
    // its own reconciliation on the same question.
    if (stored.isControlled.value) return key ?? null;
    if (key != null && collection.getItem(key)) return key;

    return findDefaultSelectedKey();
  });

  const selection = useSelectionManager({
    collection,
    disabledKeys: () => toValue(options.disabledKeys),
    disallowEmptySelection: true,
    onSelectionChange: (keys) => {
      if (keys === "all") return;

      const [key] = [...keys];

      if (key != null) stored.setState(key);
    },
    selectedKeys: () => (selectedKey.value != null ? [selectedKey.value] : []),
    selectionMode: "single",
  });

  // What React Stately's `lastSelectedKey` ref holds before its first effect runs.
  let lastSelectedKey = selectedKey.value;

  /**
   * The selection places focus, because on a list like this it is the only thing that can.
   *
   * React Aria's tab list element ends up with no tab index of its own, so the roving index on
   * the selected item is the only way in — and with no focused key nothing inside is tabbable
   * either, which would put the whole list out of the tab order.
   *
   * Post-flush and keyed on the collection's size, because setting a focused key the collection
   * does not hold is refused: the first attempt runs before the items have registered, and the
   * registration is what makes the retry land.
   */
  watch(
    [selectedKey, collection.size, () => selection.focusedKey.value == null],
    () => {
      const key = selectedKey.value;

      if (key == null) return;

      if (
        selection.focusedKey.value == null ||
        (!selection.isFocused.value && key !== lastSelectedKey)
      ) {
        selection.setFocusedKey(key);
      }

      lastSelectedKey = key;
    },
    { flush: "post", immediate: true },
  );

  return {
    collection,
    isDisabled: computed(() => Boolean(toValue(options.isDisabled))),
    selectedKey,
    selection,
    setSelectedKey: (key) => stored.setState(key),
  };
};
