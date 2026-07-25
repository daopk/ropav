import { nextTick, watchEffect, type ComputedRef } from 'vue';
import {
    useControllableValue,
    type UseControllableValueOptions,
} from '@/composables/useControllableValue';
import { useFormControl, type FormControlOptions, type NativeFormControl } from './useFormControl';

export interface NativeChoiceAdapter<Value> {
    controls: () => Array<NativeFormControl | null | undefined>;
    readResetValue: (controls: NativeFormControl[], initialValue: Value) => Value;
    reconcileValue?: (value: Value, initialValue: Value, isControlled: boolean) => Value;
    syncValue: (value: Value, defaultValue: Value) => void;
    validationMessage?: FormControlOptions['validationMessage'];
}

export interface NativeChoiceTransactionOptions<Value> {
    value: Readonly<UseControllableValueOptions<Value>>;
    adapter: NativeChoiceAdapter<Value>;
    onFormReset?: () => void;
}

export interface NativeChoiceTransaction<Value> {
    isControlled: ComputedRef<boolean>;
    requestValueUpdate: (value: Value) => void;
    value: ComputedRef<Value>;
}

export function useNativeChoiceTransaction<Value>(
    options: Readonly<NativeChoiceTransactionOptions<Value>>,
): NativeChoiceTransaction<Value> {
    const controllable = useControllableValue(options.value);

    function syncNativeValue(value: Value) {
        options.adapter.syncValue(value, controllable.initialValue);
    }

    function restoreControlledValue() {
        if (!controllable.isControlled.value) return;
        queueMicrotask(() => syncNativeValue(controllable.value.value));
    }

    function requestValueUpdate(value: Value) {
        controllable.setValue(value);
        restoreControlledValue();
    }

    useFormControl({
        elements: options.adapter.controls,
        isControlled: () => controllable.isControlled.value,
        validationMessage: options.adapter.validationMessage,
        readResetValue(controls) {
            controllable.resetValue(
                options.adapter.readResetValue(controls, controllable.initialValue),
            );
            syncNativeValue(controllable.value.value);
            options.onFormReset?.();
        },
        syncControlledValue() {
            syncNativeValue(controllable.value.value);
            options.onFormReset?.();
        },
    });

    watchEffect(
        () => {
            const currentValue = controllable.value.value;
            const reconciledValue =
                options.adapter.reconcileValue?.(
                    currentValue,
                    controllable.initialValue,
                    controllable.isControlled.value,
                ) ?? currentValue;

            if (!controllable.isControlled.value && !Object.is(reconciledValue, currentValue)) {
                controllable.resetValue(reconciledValue);
            }

            syncNativeValue(controllable.value.value);
            void nextTick(() => syncNativeValue(controllable.value.value));
        },
        { flush: 'post' },
    );

    return {
        isControlled: controllable.isControlled,
        requestValueUpdate,
        value: controllable.value,
    };
}
