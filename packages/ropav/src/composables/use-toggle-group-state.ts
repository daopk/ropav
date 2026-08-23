import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";

export type ToggleGroupKey = string | number;

export type ToggleGroupSelectionMode = "single" | "multiple";

export interface UseToggleGroupStateOptions {
  /** Selected keys in uncontrolled mode. */
  defaultSelectedKeys?: Iterable<ToggleGroupKey>;
  /** Whether the group must always keep at least one key selected. */
  disallowEmptySelection?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether the whole group is disabled. */
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Called with the next selected key set whenever it changes. */
  onSelectionChange?: (keys: Set<ToggleGroupKey>) => void;
  /** Selected keys in controlled mode. */
  selectedKeys?: MaybeRefOrGetter<Iterable<ToggleGroupKey> | undefined>;
  /** Whether one or many keys can be selected at a time. @default "single" */
  selectionMode?: MaybeRefOrGetter<ToggleGroupSelectionMode | undefined>;
}

export interface UseToggleGroupStateReturn {
  /** Currently selected keys. */
  selectedKeys: ComputedRef<Set<ToggleGroupKey>>;
  /** Whether one or many keys can be selected at a time. */
  selectionMode: ComputedRef<ToggleGroupSelectionMode>;
  /** Whether the whole group is disabled. */
  isDisabled: ComputedRef<boolean>;
  /** Whether a given key is selected. */
  isSelected: (key: ToggleGroupKey) => boolean;
  /** Flip a key's selection, honouring the selection mode. */
  toggleKey: (key: ToggleGroupKey) => void;
  /** Drive a key to an explicit state. A no-op when it already holds it. */
  setSelected: (key: ToggleGroupKey, isSelected: boolean) => void;
}

/**
 * Selected-key state for a group of toggle buttons, the Vue counterpart of React
 * Stately's `useToggleGroupState`.
 *
 * `selectionMode` decides what a toggle does rather than which keys are legal: in
 * `"multiple"` a key is added to or removed from the set, while in `"single"` it replaces
 * whatever was selected. `disallowEmptySelection` keeps the last remaining key from being
 * turned off, which is what makes a single-selection group behave like a radio group
 * rather than a row of independent toggles.
 *
 * @example
 * ```ts
 * const state = useToggleGroupState({
 *   selectedKeys: () => props.selectedKeys,
 *   selectionMode: () => props.selectionMode,
 *   onSelectionChange: (keys) => emit("selectionChange", keys),
 * });
 * ```
 */
export const useToggleGroupState = (
  options: UseToggleGroupStateOptions = {},
): UseToggleGroupStateReturn => {
  const selectionMode = computed(() => toValue(options.selectionMode) ?? "single");
  const disallowEmptySelection = computed(() => toValue(options.disallowEmptySelection) ?? false);
  const isDisabled = computed(() => toValue(options.isDisabled) ?? false);

  const {setState, state} = useControllableState<Set<ToggleGroupKey>>({
    defaultValue: new Set(options.defaultSelectedKeys ?? []),
    onValueChange: options.onSelectionChange,
    value: () => {
      const keys = toValue(options.selectedKeys);

      return keys === undefined ? undefined : new Set(keys);
    },
  });

  const isSelected = (key: ToggleGroupKey) => state.value.has(key);

  const toggleKey = (key: ToggleGroupKey) => {
    // Guarded here rather than left to the DOM. React Aria leans on the `disabled`
    // attribute to swallow the press, which holds for a native button but not for a
    // caller reaching the state directly, and not for `aria-disabled` controls.
    if (isDisabled.value) return;

    setState((previous) => {
      if (selectionMode.value === "multiple") {
        const next = new Set(previous);

        // The last remaining key stays put when the group refuses an empty selection.
        if (next.has(key) && (!disallowEmptySelection.value || next.size > 1)) next.delete(key);
        else next.add(key);

        return next;
      }

      // Single selection: pressing the selected key clears it, unless that would empty
      // the group and emptiness is disallowed.
      return new Set(previous.has(key) && !disallowEmptySelection.value ? [] : [key]);
    });
  };

  const setSelected = (key: ToggleGroupKey, selected: boolean) => {
    if (selected !== isSelected(key)) toggleKey(key);
  };

  return {
    isDisabled,
    isSelected,
    selectedKeys: computed(() => state.value),
    selectionMode,
    setSelected,
    toggleKey,
  };
};
