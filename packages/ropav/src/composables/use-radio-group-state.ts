import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "./use-form-validation-state";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

import { useControllableState } from "./use-controllable-state";
import { useFormValidationState } from "./use-form-validation-state";
import { useId } from "./use-id";

export interface UseRadioGroupStateOptions {
  /** Selected value. Makes the group controlled. */
  value?: MaybeRefOrGetter<string | null | undefined>;
  /** Value selected to begin with, when the group is uncontrolled. */
  defaultValue?: MaybeRefOrGetter<string | null | undefined>;
  onValueChange?: (value: string | null) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether one of the radios has to be selected. */
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<string | null> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /** Name the radios share. Generated when the caller gives none. */
  name?: MaybeRefOrGetter<string | undefined>;
}

export interface RadioGroupState {
  /**
   * Name every radio in the group submits under. Shared on purpose: `required` on a radio is
   * scoped by name, and that scoping is the whole reason the native constraint works.
   */
  name: ComputedRef<string>;
  selectedValue: ComputedRef<string | null>;
  /** Value a form reset goes back to. */
  defaultSelectedValue: ComputedRef<string | null>;
  /**
   * Value of the radio focus last rested on. With nothing selected, this is what decides
   * which radio the group's single tab stop lands on.
   */
  lastFocusedValue: ComputedRef<string | null>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  validation: FormValidationState;
  setSelectedValue: (value: string | null) => void;
  setLastFocusedValue: (value: string | null) => void;
}

/**
 * Selection and validation for a group of radios, ported from React Aria's
 * `packages/react-stately/src/radio/useRadioGroupState.ts` (react-stately 3.49.0).
 *
 * Unlike a checkbox group, requiredness needs no emulation here: `required` on a radio is
 * scoped to its name, and the browser clears `valueMissing` across the whole named group as
 * soon as any one of them is checked. Sharing one generated name is what buys that.
 *
 * Selecting commits validation straight away, because a radio group has no meaningful
 * "back to nothing" for the user to return to.
 *
 * @example
 * ```ts
 * const state = useRadioGroupState({
 *   onValueChange: (value) => emit("change", value),
 *   value: () => props.value,
 * });
 * ```
 */
export const useRadioGroupState = (options: UseRadioGroupStateOptions = {}): RadioGroupState => {
  const name = useId(() => toValue(options.name));

  const { setState, state } = useControllableState<string | null>({
    defaultValue: toValue(options.defaultValue) ?? null,
    onValueChange: options.onValueChange,
    value: () => toValue(options.value),
  });

  // Captured once: a controlled group resets to whatever it held when it first rendered,
  // since its `value` prop describes the present rather than the starting point.
  const initialValue = state.value;
  const isControlled = toValue(options.value) !== undefined;

  const selectedValue = computed(() => state.value);
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const isRequired = computed(() => Boolean(toValue(options.isRequired)));

  const lastFocused = shallowRef<string | null>(null);

  const validation = useFormValidationState<string | null>({
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    validate: () => toValue(options.validate),
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => selectedValue.value,
  });

  return {
    defaultSelectedValue: computed(() =>
      isControlled ? initialValue : (toValue(options.defaultValue) ?? null),
    ),
    isDisabled,
    isInvalid: computed(() => validation.displayValidation.value.isInvalid),
    isReadOnly,
    isRequired,
    lastFocusedValue: computed(() => lastFocused.value),
    name,
    selectedValue,
    setLastFocusedValue: (value) => {
      lastFocused.value = value;
    },
    setSelectedValue: (value) => {
      if (isReadOnly.value || isDisabled.value) return;

      setState(value);
      validation.commitValidation();
    },
    validation,
  };
};
