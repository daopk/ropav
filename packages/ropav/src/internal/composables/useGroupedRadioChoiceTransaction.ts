import { computed, shallowRef, type ComputedRef } from 'vue';
import type { UseControllableValueOptions } from '@/composables/useControllableValue';
import { useNativeChoiceTransaction, type NativeChoiceAdapter } from './useNativeChoiceTransaction';

interface GroupedRadioChoice<Value> {
    disabled?: boolean;
    value: Value;
}

interface GroupedRadioChoiceValueOptions<Value> {
    defaultValue: () => Value | null | undefined;
    modelValue: () => Value | null | undefined;
    onChange: (value: Value | null) => void;
}

export interface GroupedRadioChoiceTransactionOptions<Value> {
    choices: () => readonly GroupedRadioChoice<Value>[] | undefined;
    disabled: () => boolean;
    validationMessage?: () => string | undefined;
    value: Readonly<GroupedRadioChoiceValueOptions<Value>>;
}

export interface GroupedRadioChoiceTransaction<Value> {
    acceptValue: (value: Value) => void;
    createInputRef: (value: Value) => (element: unknown) => void;
    inputRefs: ComputedRef<Array<HTMLInputElement | null>>;
    value: ComputedRef<Value | null>;
}

function getFirstEnabledValue<Value>(
    choices: readonly GroupedRadioChoice<Value>[] | undefined,
): Value | null {
    return choices?.find((choice) => !choice.disabled)?.value ?? null;
}

function getChoiceMetadata<Value>(
    choices: readonly GroupedRadioChoice<Value>[] | undefined,
): Array<readonly [Value, boolean]> {
    return choices?.map((choice) => [choice.value, Boolean(choice.disabled)] as const) ?? [];
}

function hasSameChoiceMetadata<Value>(
    previous: readonly (readonly [Value, boolean])[],
    next: readonly (readonly [Value, boolean])[],
) {
    return (
        previous.length === next.length &&
        previous.every(
            ([value, disabled], index) =>
                value === next[index]?.[0] && disabled === next[index]?.[1],
        )
    );
}

export function useGroupedRadioChoiceTransaction<Value>(
    options: Readonly<GroupedRadioChoiceTransactionOptions<Value>>,
): GroupedRadioChoiceTransaction<Value> {
    const inputsByValue = shallowRef(new Map<Value, HTMLInputElement>());
    const inputRefs = computed(
        () =>
            options.choices()?.map((choice) => inputsByValue.value.get(choice.value) ?? null) ?? [],
    );
    const explicitDefaultValue = options.value.defaultValue();
    const hasExplicitEmptyDefault = explicitDefaultValue === null;
    const initialValue =
        explicitDefaultValue === undefined
            ? getFirstEnabledValue(options.choices())
            : explicitDefaultValue;
    let nativeResetValue = initialValue;
    let choiceMetadata = getChoiceMetadata(options.choices());
    let shouldSyncNativeDefault = true;

    function findInputChoice(input: HTMLInputElement) {
        const index = inputRefs.value.indexOf(input);
        return index < 0 ? undefined : options.choices()?.[index];
    }

    function getResetValue(currentValue: Value | null) {
        if (hasExplicitEmptyDefault) return null;

        const initialChoice = options.choices()?.find((choice) => choice.value === initialValue);
        if (initialChoice && !initialChoice.disabled) return initialChoice.value;

        const fallbackValue = getFirstEnabledValue(options.choices());
        return currentValue === fallbackValue ? fallbackValue : initialValue;
    }

    function getValidationAnchor(currentValue: Value | null) {
        let firstEnabledInput: HTMLInputElement | undefined;

        for (const [index, choice] of (options.choices() ?? []).entries()) {
            const input = inputRefs.value[index];
            if (!input || options.disabled() || choice.disabled) continue;
            firstEnabledInput ??= input;
            if (choice.value === currentValue) return input;
        }

        return firstEnabledInput;
    }

    function syncInputs(value: Value | null) {
        for (const [index, input] of inputRefs.value.entries()) {
            if (!input) continue;
            const choiceValue = options.choices()?.[index]?.value;
            input.checked = choiceValue === value;
        }

        if (!shouldSyncNativeDefault) return;
        shouldSyncNativeDefault = false;

        for (const [index, input] of inputRefs.value.entries()) {
            if (input)
                input.defaultChecked = options.choices()?.[index]?.value === nativeResetValue;
        }
    }

    const valueOptions: UseControllableValueOptions<Value | null> = {
        modelValue: options.value.modelValue,
        defaultValue: () => initialValue,
        onChange: options.value.onChange,
    };

    let currentValue: ComputedRef<Value | null>;
    const adapter: NativeChoiceAdapter<Value | null> = {
        commitValue(_value, _initialValue, applyValue) {
            applyValue();
        },
        controls: () => inputRefs.value,
        readResetValue(controls) {
            const checked = controls.find((control) => (control as HTMLInputElement).checked) as
                | HTMLInputElement
                | undefined;
            return checked ? (findInputChoice(checked)?.value ?? null) : null;
        },
        reconcileValue(value, _initialValue, isControlled) {
            const nextChoiceMetadata = getChoiceMetadata(options.choices());
            if (hasSameChoiceMetadata(choiceMetadata, nextChoiceMetadata)) return value;
            choiceMetadata = nextChoiceMetadata;

            let reconciledValue = value;
            if (!isControlled && !(value === null && hasExplicitEmptyDefault)) {
                const hasEnabledSelection = options
                    .choices()
                    ?.some((choice) => choice.value === value && !choice.disabled);
                reconciledValue = hasEnabledSelection
                    ? value
                    : getFirstEnabledValue(options.choices());
            }

            nativeResetValue = getResetValue(reconciledValue);
            shouldSyncNativeDefault = true;

            return reconciledValue;
        },
        syncValue: syncInputs,
        validationMessage(element) {
            return element === getValidationAnchor(currentValue.value)
                ? options.validationMessage?.()
                : undefined;
        },
    };
    const transaction = useNativeChoiceTransaction({
        value: valueOptions,
        adapter,
    });
    currentValue = transaction.value;

    function createInputRef(value: Value) {
        let mountedInput: HTMLInputElement | null = null;

        return (element: unknown) => {
            const input = element instanceof HTMLInputElement ? element : null;

            if (input) {
                mountedInput = input;
                input.defaultChecked = value === nativeResetValue;
                const existingInput = inputsByValue.value.get(value);
                const hasOtherRegistration = [...inputsByValue.value].some(
                    ([registeredValue, registeredInput]) =>
                        registeredValue !== value && registeredInput === input,
                );
                if (existingInput === input && !hasOtherRegistration) return;

                const nextInputs = new Map(inputsByValue.value);
                for (const [registeredValue, registeredInput] of nextInputs) {
                    if (registeredInput === input) nextInputs.delete(registeredValue);
                }
                nextInputs.set(value, input);
                inputsByValue.value = nextInputs;
                return;
            }

            const removedInput = mountedInput;
            mountedInput = null;
            if (!removedInput || inputsByValue.value.get(value) !== removedInput) return;

            const nextInputs = new Map(inputsByValue.value);
            nextInputs.delete(value);
            inputsByValue.value = nextInputs;
        };
    }

    return {
        acceptValue: transaction.requestValueUpdate,
        createInputRef,
        inputRefs,
        value: transaction.value,
    };
}
