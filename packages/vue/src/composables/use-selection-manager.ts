import type {CollectionKey, UseCollectionReturn} from "./use-collection";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, shallowRef, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";

export type SelectionMode = "none" | "single" | "multiple";

/**
 * `"toggle"` — a press adds to or removes from the selection, as checkboxes do.
 * `"replace"` — a press replaces the selection, and modifiers are needed to extend it.
 */
export type SelectionBehavior = "toggle" | "replace";

/**
 * `"all"` — a disabled item can neither be focused nor selected.
 * `"selection"` — it can still be focused and acted on, just not selected.
 */
export type DisabledBehavior = "all" | "selection";

/**
 * Named `CollectionSelection` rather than `Selection`: every composable is re-exported at the
 * package root, and a type called `Selection` would shadow the DOM global for consumers.
 */
export type CollectionSelection = "all" | Set<CollectionKey>;

export interface UseSelectionManagerProps {
  collection: UseCollectionReturn;
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  selectedKeys?: MaybeRefOrGetter<"all" | Iterable<CollectionKey> | undefined>;
  onSelectionChange?: (keys: CollectionSelection) => void;
  /** @default "none" */
  selectionMode?: MaybeRefOrGetter<SelectionMode | undefined>;
  /** @default "toggle" */
  selectionBehavior?: MaybeRefOrGetter<SelectionBehavior | undefined>;
  disallowEmptySelection?: MaybeRefOrGetter<boolean | undefined>;
  disabledKeys?: MaybeRefOrGetter<Iterable<CollectionKey> | undefined>;
  /** @default "all" */
  disabledBehavior?: MaybeRefOrGetter<DisabledBehavior | undefined>;
}

export interface UseSelectionManagerReturn {
  selectionMode: ComputedRef<SelectionMode>;
  selectionBehavior: ComputedRef<SelectionBehavior>;
  disabledBehavior: ComputedRef<DisabledBehavior>;
  disabledKeys: ComputedRef<Set<CollectionKey>>;
  /** Kept as `"all"` when that is what it is, so a change handler can report it verbatim. */
  rawSelection: ComputedRef<CollectionSelection>;
  /** `"all"` resolved against the collection. */
  selectedKeys: ComputedRef<Set<CollectionKey>>;
  isEmpty: ComputedRef<boolean>;
  isSelectAll: ComputedRef<boolean>;
  firstSelectedKey: ComputedRef<CollectionKey | null>;
  lastSelectedKey: ComputedRef<CollectionKey | null>;
  focusedKey: ComputedRef<CollectionKey | null>;
  isFocused: ComputedRef<boolean>;
  setFocused: (isFocused: boolean) => void;
  setFocusedKey: (key: CollectionKey | null) => void;
  isSelected: (key: CollectionKey) => boolean;
  /** Whether the item is inert: not focusable and not selectable. */
  isDisabled: (key: CollectionKey) => boolean;
  /** Whether the item may be selected, regardless of whether it may be focused. */
  canSelectItem: (key: CollectionKey) => boolean;
  toggleSelection: (key: CollectionKey) => void;
  replaceSelection: (key: CollectionKey) => void;
  extendSelection: (key: CollectionKey) => void;
  setSelectedKeys: (keys: Iterable<CollectionKey>) => void;
  selectAll: () => void;
  clearSelection: () => void;
  /** What a press means, given the mode, the behaviour and the modifiers. */
  select: (
    key: CollectionKey,
    options?: {isShiftPressed?: boolean; isCtrlPressed?: boolean},
  ) => void;
}

/**
 * Selected and focused keys for a collection, ported from React Stately's `SelectionManager`
 * and `useMultipleSelectionState`.
 *
 * The interesting part is that `selectionMode` decides what a press *means* rather than which
 * keys are legal, and that `isDisabled` and `canSelectItem` are deliberately different
 * questions: `disabledBehavior: "selection"` describes an item a user can still reach and act
 * on but cannot select, so a single predicate would collapse a real distinction.
 *
 * `"all"` is held verbatim rather than expanded, because that is what React Stately reports to
 * `onSelectionChange` and a consumer persisting the value needs the same fidelity.
 */
export const useSelectionManager = (props: UseSelectionManagerProps): UseSelectionManagerReturn => {
  const {collection} = props;

  const selectionMode = computed(() => toValue(props.selectionMode) ?? "none");
  const selectionBehavior = computed(() => toValue(props.selectionBehavior) ?? "toggle");
  const disabledBehavior = computed(() => toValue(props.disabledBehavior) ?? "all");
  const disallowEmptySelection = computed(() => toValue(props.disallowEmptySelection) ?? false);
  const disabledKeys = computed(() => new Set(toValue(props.disabledKeys) ?? []));

  const toSelection = (keys: "all" | Iterable<CollectionKey>): CollectionSelection =>
    keys === "all" ? "all" : new Set(keys);

  const {setState, state} = useControllableState<CollectionSelection>({
    defaultValue: toSelection(props.defaultSelectedKeys ?? []),
    onValueChange: props.onSelectionChange,
    value: () => {
      const keys = toValue(props.selectedKeys);

      return keys === undefined ? undefined : toSelection(keys);
    },
  });

  // Held beside the selection rather than on it. React Stately subclasses `Set` to carry these,
  // which would leak the subclass into every `onSelectionChange` payload.
  const anchorKey = shallowRef<CollectionKey | null>(null);
  const currentKey = shallowRef<CollectionKey | null>(null);

  const focusedKeyRef = shallowRef<CollectionKey | null>(null);
  const isFocusedRef = shallowRef(false);

  const canSelectItem = (key: CollectionKey) => {
    if (selectionMode.value === "none" || disabledKeys.value.has(key)) return false;

    const item = collection.getItem(key);

    return Boolean(item) && !item!.isDisabled();
  };

  const isDisabled = (key: CollectionKey) => {
    if (disabledBehavior.value !== "all") return false;

    return disabledKeys.value.has(key) || Boolean(collection.getItem(key)?.isDisabled());
  };

  /** Every key that a select-all would cover. */
  const selectAllKeys = () => collection.orderedKeys().filter(canSelectItem);

  const selectedKeys = computed(() =>
    state.value === "all" ? new Set(selectAllKeys()) : state.value,
  );

  const isEmpty = computed(() => state.value !== "all" && state.value.size === 0);

  const isSelected = (key: CollectionKey) =>
    state.value === "all" ? canSelectItem(key) : state.value.has(key);

  const commit = (keys: CollectionSelection) => setState(() => keys);

  const replaceSelection = (key: CollectionKey) => {
    if (selectionMode.value === "none") return;

    if (canSelectItem(key)) {
      anchorKey.value = key;
      currentKey.value = key;
      commit(new Set([key]));
    } else {
      commit(new Set());
    }
  };

  const toggleSelection = (key: CollectionKey) => {
    if (selectionMode.value === "none") return;

    // Turning on an unselected item in single mode is a replacement, not an addition.
    if (selectionMode.value === "single" && !isSelected(key)) {
      replaceSelection(key);

      return;
    }

    const next = new Set(state.value === "all" ? selectAllKeys() : state.value);

    if (next.has(key)) {
      next.delete(key);
    } else if (canSelectItem(key)) {
      next.add(key);
      anchorKey.value = key;
      currentKey.value = key;
    }

    // Refusing the change outright, rather than clamping it, is what makes a group behave like
    // a radio group instead of a row of independent toggles.
    if (disallowEmptySelection.value && next.size === 0) return;

    commit(next);
  };

  /** The keys from `from` to `to` inclusive, in document order whichever way round they are. */
  const keyRange = (from: CollectionKey, to: CollectionKey) => {
    const keys = collection.orderedKeys();
    const start = keys.indexOf(from);
    const end = keys.indexOf(to);

    if (start === -1 || end === -1) return [];

    return keys.slice(Math.min(start, end), Math.max(start, end) + 1);
  };

  const extendSelection = (key: CollectionKey) => {
    if (selectionMode.value === "none") return;

    if (selectionMode.value === "single") {
      replaceSelection(key);

      return;
    }

    // Coming from a select-all, an extension collapses to just the key pressed.
    if (state.value === "all") {
      anchorKey.value = key;
      currentKey.value = key;
      commit(new Set([key]));

      return;
    }

    const anchor = anchorKey.value ?? key;
    const next = new Set(state.value);

    // Drop the previous span before adding the new one, so shrinking a range deselects the
    // keys that fall outside it rather than leaving them behind.
    for (const previous of keyRange(anchor, currentKey.value ?? key)) next.delete(previous);
    for (const inRange of keyRange(key, anchor)) if (canSelectItem(inRange)) next.add(inRange);

    anchorKey.value = anchor;
    currentKey.value = key;
    commit(next);
  };

  const setSelectedKeys = (keys: Iterable<CollectionKey>) => {
    if (selectionMode.value === "none") return;

    const next = new Set<CollectionKey>();

    for (const key of keys) {
      next.add(key);
      // Single selection takes the first key offered and ignores the rest.
      if (selectionMode.value === "single") break;
    }

    commit(next);
  };

  const isSelectAll = computed(() => {
    if (isEmpty.value) return false;
    if (state.value === "all") return true;

    const all = selectAllKeys();

    return all.length > 0 && all.every((key) => (state.value as Set<CollectionKey>).has(key));
  });

  const orderedSelectedKeys = computed(() => {
    const selected = selectedKeys.value;

    return collection.orderedKeys().filter((key) => selected.has(key));
  });

  return {
    canSelectItem,
    clearSelection: () => {
      if (disallowEmptySelection.value) return;
      if (state.value === "all" || state.value.size > 0) commit(new Set());
    },
    disabledBehavior,
    disabledKeys,
    extendSelection,
    firstSelectedKey: computed(() => orderedSelectedKeys.value[0] ?? null),
    focusedKey: computed(() => focusedKeyRef.value),
    isDisabled,
    isEmpty,
    isFocused: computed(() => isFocusedRef.value),
    isSelectAll,
    isSelected,
    lastSelectedKey: computed(() => orderedSelectedKeys.value.at(-1) ?? null),
    rawSelection: computed(() => state.value),
    replaceSelection,
    select: (key, options = {}) => {
      if (selectionMode.value === "none") return;

      if (selectionMode.value === "single") {
        if (isSelected(key) && !disallowEmptySelection.value) toggleSelection(key);
        else replaceSelection(key);

        return;
      }

      if (options.isShiftPressed) extendSelection(key);
      else if (selectionBehavior.value === "toggle" || options.isCtrlPressed) toggleSelection(key);
      else replaceSelection(key);
    },
    selectAll: () => {
      if (!isSelectAll.value && selectionMode.value === "multiple") commit("all");
    },
    selectedKeys,
    selectionBehavior,
    selectionMode,
    setFocused: (focused) => {
      isFocusedRef.value = focused;
    },
    setFocusedKey: (key) => {
      // A key the collection does not hold would park focus on nothing, so it is refused
      // rather than stored and puzzled over later.
      if (key !== null && !collection.getItem(key)) return;

      focusedKeyRef.value = key;
    },
    setSelectedKeys,
    toggleSelection,
  };
};
