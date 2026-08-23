import type { CollectionKey, UseCollectionReturn } from "./use-collection";
import type { UseSelectionManagerReturn } from "./use-selection-manager";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, toValue, watch } from "vue";

import { useCollection } from "./use-collection";
import { useControllableState } from "./use-controllable-state";
import { useId } from "./use-id";
import { useSelectionManager } from "./use-selection-manager";

export interface UseTabListStateOptions {
  /** The selected tab, when the caller drives it. */
  selectedKey?: MaybeRefOrGetter<CollectionKey | undefined>;
  /** The initially selected tab. Falls back to the first tab that is not disabled. */
  defaultSelectedKey?: CollectionKey;
  onSelectionChange?: (key: CollectionKey) => void;
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  /** Whether the whole tab list is disabled: a selection that exists but cannot be changed. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** A base the tab and panel ids are derived from. Generated when absent. */
  id?: MaybeRefOrGetter<string | undefined>;
}

export interface UseTabListStateReturn {
  collection: UseCollectionReturn;
  selection: UseSelectionManagerReturn;
  /** The selected tab, with the default resolved against the collection. */
  selectedKey: ComputedRef<CollectionKey | null>;
  setSelectedKey: (key: CollectionKey) => void;
  isDisabled: ComputedRef<boolean>;
  /** The tab list's own id, which the tab and panel ids hang off. */
  tabsId: ComputedRef<string>;
  /** `undefined` for a key that does not exist, so no attribute points at nothing. */
  tabId: (key: CollectionKey | null | undefined) => string | undefined;
  tabPanelId: (key: CollectionKey | null | undefined) => string | undefined;
}

/**
 * Which tab is selected, and the ids that tie each tab to its panel.
 *
 * Ported from React Stately's `useTabListState` and the `useSingleSelectListState` layer beneath
 * it (`react-stately/src/tabs/useTabListState.ts`, react-stately 3.49.0), together with the id
 * scheme from `react-aria/src/tabs/utils.ts` (react-aria 3.51.0).
 *
 * A tab list always has exactly one tab selected, which is `disallowEmptySelection` plus a
 * fallback for the case where nothing says which. The selection behaviour is deliberately left at
 * toggle: whether the arrow keys choose is a question about how activation works, asked by the
 * caller through `selectOnFocus`, not a question about what a press means.
 *
 * The three pieces have to be built in one order — the collection, then the fallback that reads
 * it, then the selection manager the fallback feeds — which is the reason this is a composable
 * rather than a few lines in the root component.
 */
export const useTabListState = (options: UseTabListStateOptions = {}): UseTabListStateReturn => {
  const collection = useCollection();

  const disabledKeySet = computed(() => new Set(toValue(options.disabledKeys) ?? []));

  /**
   * Whether a tab can be selected, asked of the collection rather than of the selection manager.
   *
   * Two reasons, and either alone would be enough: the fallback below runs before the manager
   * exists, and React Stately asks the same question the same way — an item's own disabled state
   * or the group's disabled keys, with no `disabledBehavior` in it.
   */
  const isKeyDisabled = (key: CollectionKey) =>
    disabledKeySet.value.has(key) || Boolean(collection.getItem(key)?.isDisabled());

  /** The first tab that can be selected, or the first tab when none of them can. */
  const findDefaultSelectedKey = (): CollectionKey | null => {
    let key = collection.getFirstKey();

    while (key != null && isKeyDisabled(key) && key !== collection.getLastKey()) {
      key = collection.getKeyAfter(key);
    }

    // Every tab is disabled. The first one reads better than the last.
    if (key != null && isKeyDisabled(key) && key === collection.getLastKey()) {
      key = collection.getFirstKey();
    }

    return key;
  };

  const stored = useControllableState<CollectionKey | null>({
    defaultValue: options.defaultSelectedKey ?? null,
    onValueChange: (key) => {
      if (key != null) options.onSelectionChange?.(key);
    },
    value: () => toValue(options.selectedKey),
  });

  /**
   * The selected tab, with the fallback resolved as a read rather than written back.
   *
   * React Stately can resolve it before the first render, because the collection is built by a
   * pass that runs before it. Rendering is what creates the collection here, so writing the
   * fallback into the selection would report a selection change nobody made, on every mount of
   * every uncontrolled tab list.
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
   * The selection places focus, because on a tab list it is the only thing that can.
   *
   * React Aria's tab list element ends up with no tab index of its own, so the roving index on
   * the selected tab is the only way in — and with no focused key nothing inside is tabbable
   * either, which would put the whole tab list out of the tab order.
   *
   * Post-flush and keyed on the collection's size, because setting a focused key the collection
   * does not hold is refused: the first attempt runs before the tabs have registered, and the
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

  const tabsId = useId(() => toValue(options.id));

  /** React Aria strips whitespace out of a string key so the id stays a single token. */
  const idFor = (key: CollectionKey | null | undefined, role: "tab" | "tabpanel") =>
    key == null ? undefined : `${tabsId.value}-${role}-${String(key).replace(/\s+/g, "")}`;

  return {
    collection,
    isDisabled: computed(() => Boolean(toValue(options.isDisabled))),
    selectedKey,
    selection,
    setSelectedKey: (key) => stored.setState(key),
    tabId: (key) => idFor(key, "tab"),
    tabPanelId: (key) => idFor(key, "tabpanel"),
    tabsId,
  };
};
