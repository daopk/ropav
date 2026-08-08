import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
  ValidationResult,
} from "./use-form-validation-state";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, nextTick, toValue} from "vue";

import {useControllableState} from "./use-controllable-state";
import {
  DEFAULT_VALIDATION_RESULT,
  getNativeValidation,
  useFormValidationState,
} from "./use-form-validation-state";

export interface UseCheckboxGroupStateOptions {
  /** Selected values. Makes the group controlled. */
  value?: MaybeRefOrGetter<string[] | undefined>;
  /** Values selected to begin with, when the group is uncontrolled. */
  defaultValue?: MaybeRefOrGetter<string[] | undefined>;
  onValueChange?: (value: string[]) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
  isReadOnly?: MaybeRefOrGetter<boolean | undefined>;
  /** Whether at least one item has to be selected. */
  isRequired?: MaybeRefOrGetter<boolean | undefined>;
  isInvalid?: MaybeRefOrGetter<boolean | undefined>;
  validate?: MaybeRefOrGetter<ValidationFunction<string[]> | undefined>;
  validationBehavior?: MaybeRefOrGetter<ValidationBehavior | undefined>;
  /** Name every item submits under, and the key server errors arrive on. */
  name?: MaybeRefOrGetter<string | undefined>;
}

export interface CheckboxGroupState {
  /** Currently selected values. */
  value: ComputedRef<string[]>;
  /** Values a form reset goes back to. */
  defaultValue: ComputedRef<string[]>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  /** Requiredness as the group announces it. */
  isRequired: ComputedRef<boolean>;
  /**
   * Requiredness as each item *renders* it — true only while nothing is selected. See
   * `useCheckboxGroupState` for why it has to drop off every item at once.
   */
  isItemRequired: ComputedRef<boolean>;
  isInvalid: ComputedRef<boolean>;
  /** The group's own validation, which its `FieldError` shows. */
  validation: FormValidationState;
  /** What each item hands to `useFormValidation`. */
  itemValidation: FormValidationState;
  isSelected: (value: string) => boolean;
  setValue: (value: string[]) => void;
  addValue: (value: string) => void;
  removeValue: (value: string) => void;
  toggleValue: (value: string, isSelected: boolean) => void;
  /** Item inputs register here so the group can read validity off real elements. */
  registerInput: (input: HTMLInputElement) => () => void;
}

/**
 * Selection and validation for a group of checkboxes, ported from React Aria's
 * `packages/react-stately/src/checkbox/useCheckboxGroupState.ts` (react-stately 3.49.0).
 *
 * The interesting part is `isRequired`. HTML can say "this control is required" but has no
 * way to say "at least one control of this name", so the group emulates it: while nothing is
 * selected, **every** item renders `required`, so the browser refuses the submit and reports
 * `valueMissing`. The moment anything is selected the flag drops off *all* of them at once —
 * which is the whole trick, because one leftover `required` unchecked sibling would keep the
 * form invalid for good.
 *
 * The violation therefore lands on the items rather than on the group, so the group reads it
 * back from the inputs that registered with it.
 *
 * @example
 * ```ts
 * const state = useCheckboxGroupState({
 *   isRequired: () => props.isRequired,
 *   onValueChange: (value) => emit("change", value),
 *   value: () => props.value,
 * });
 * ```
 */
export const useCheckboxGroupState = (
  options: UseCheckboxGroupStateOptions = {},
): CheckboxGroupState => {
  const defaultValue = computed<string[]>(() => toValue(options.defaultValue) ?? []);

  const {setState, state} = useControllableState<string[]>({
    defaultValue: defaultValue.value,
    onValueChange: options.onValueChange,
    value: () => toValue(options.value),
  });

  const value = computed<string[]>(() => state.value);
  const isDisabled = computed(() => Boolean(toValue(options.isDisabled)));
  const isReadOnly = computed(() => Boolean(toValue(options.isReadOnly)));
  const isRequired = computed(() => Boolean(toValue(options.isRequired)));
  const isItemRequired = computed(() => isRequired.value && value.value.length === 0);

  const validation = useFormValidationState<string[]>({
    isInvalid: () => toValue(options.isInvalid),
    name: () => toValue(options.name),
    validate: () => toValue(options.validate),
    validationBehavior: () => toValue(options.validationBehavior),
    value: () => value.value,
  });

  // The items own the real inputs, so the group has to go and look at them to find out what
  // the browser thinks. A set rather than a list: an item that remounts must not appear twice.
  const inputs = new Set<HTMLInputElement>();

  const registerInput = (input: HTMLInputElement) => {
    inputs.add(input);

    return () => {
      inputs.delete(input);
    };
  };

  const readNativeValidation = (): ValidationResult => {
    for (const input of inputs) {
      if (input.disabled || input.validity.valid) continue;

      return getNativeValidation(input);
    }

    return DEFAULT_VALIDATION_RESULT;
  };

  const setValue = (next: string[]) => {
    if (isReadOnly.value || isDisabled.value) return;

    setState(next);
  };

  const isSelected = (itemValue: string) => value.value.includes(itemValue);

  const addValue = (itemValue: string) => {
    if (isSelected(itemValue)) return;

    setValue([...value.value, itemValue]);
  };

  const removeValue = (itemValue: string) => {
    if (!isSelected(itemValue)) return;

    setValue(value.value.filter((existing) => existing !== itemValue));
  };

  const toggleValue = (itemValue: string, nextIsSelected: boolean) => {
    if (nextIsSelected) addValue(itemValue);
    else removeValue(itemValue);
  };

  return {
    addValue,
    defaultValue,
    isDisabled,
    isInvalid: computed(() => validation.displayValidation.value.isInvalid),
    isItemRequired,
    isReadOnly,
    isRequired,
    isSelected,
    itemValidation: {
      ...validation,
      commitValidation: () => {
        // A tick after the flush, so `required` has settled on every item and each custom
        // error is applied — only then does the scan see what the user actually produced.
        void nextTick(() => {
          validation.updateValidation(readNativeValidation());
          validation.commitValidation();
        });
      },
      // The group reads the browser's verdict off the items itself. An item pushing its own
      // snapshot up would just race its siblings, and the last one in would win.
      updateValidation: () => {},
    },
    registerInput,
    removeValue,
    setValue,
    toggleValue,
    validation,
    value,
  };
};
