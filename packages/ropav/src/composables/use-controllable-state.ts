import type { ComputedRef, MaybeRefOrGetter, WritableComputedRef } from "vue";

import { computed, shallowRef, toValue } from "vue";

export interface UseControllableStateOptions<T> {
  /**
   * Externally controlled value. While this resolves to anything other than
   * `undefined`, the composable is in controlled mode and never mutates its own state.
   */
  value?: MaybeRefOrGetter<T | undefined>;
  /** Value used in uncontrolled mode. */
  defaultValue: T;
  /** Called whenever the value changes, in both controlled and uncontrolled mode. */
  onValueChange?: (value: T) => void;
}

export interface UseControllableStateReturn<T> {
  /** Current value. Writable — assignment routes through `setState`. */
  state: WritableComputedRef<T>;
  /** Whether an external `value` is driving the state. */
  isControlled: ComputedRef<boolean>;
  /** Update the value, either directly or with an updater function. */
  setState: (next: T | ((previous: T) => T)) => void;
}

/**
 * Controlled/uncontrolled state, the Vue counterpart of React Stately's
 * `useControlledState`.
 *
 * In controlled mode the value is read from `value` and `setState` only notifies
 * `onValueChange` — the owner of `value` decides what happens next. In uncontrolled
 * mode the value is held internally. `onValueChange` fires only on an actual change.
 *
 * @example
 * ```ts
 * const {setState, state} = useControllableState<boolean>({
 *   defaultValue: false,
 *   onValueChange: (open) => emit("update:open", open),
 *   value: () => props.open,
 * });
 * ```
 */
export const useControllableState = <T>(
  options: UseControllableStateOptions<T>,
): UseControllableStateReturn<T> => {
  const { defaultValue, onValueChange, value } = options;

  // `shallowRef`, not `ref` — the value is always replaced wholesale, never mutated
  // in place, so deep reactivity would only add overhead and proxy identity surprises.
  const uncontrolled = shallowRef<T>(defaultValue);

  const isControlled = computed(() => toValue(value) !== undefined);
  const current = computed<T>(() =>
    isControlled.value ? (toValue(value) as T) : uncontrolled.value,
  );

  const setState = (next: T | ((previous: T) => T)) => {
    const previous = current.value;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

    if (Object.is(resolved, previous)) return;

    if (!isControlled.value) uncontrolled.value = resolved;

    onValueChange?.(resolved);
  };

  const state = computed<T>({
    get: () => current.value,
    set: setState,
  });

  return { isControlled, setState, state };
};
