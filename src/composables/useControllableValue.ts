import { computed, shallowRef, watch, type ComputedRef } from 'vue';

export interface UseControllableValueOptions<T> {
    modelValue: () => T | undefined;
    defaultValue: () => T;
    onChange: (value: T) => void;
}

export interface UseControllableValueReturn<T> {
    initialValue: T;
    isControlled: ComputedRef<boolean>;
    value: ComputedRef<T>;
    setValue: (value: T) => void;
    resetValue: (value?: T) => void;
}

export function useControllableValue<T>(
    options: Readonly<UseControllableValueOptions<T>>,
): UseControllableValueReturn<T> {
    const initialValue = options.defaultValue();
    const uncontrolledValue = shallowRef<T>(initialValue);
    const isControlled = computed(() => options.modelValue() !== undefined);

    watch(
        options.modelValue,
        (value) => {
            if (value !== undefined) uncontrolledValue.value = value;
        },
        { flush: 'sync', immediate: true },
    );

    const value = computed<T>(() => {
        const modelValue = options.modelValue();
        return modelValue === undefined ? uncontrolledValue.value : modelValue;
    });

    function setValue(nextValue: T) {
        if (!isControlled.value) uncontrolledValue.value = nextValue;
        options.onChange(nextValue);
    }

    function resetValue(nextValue: T = initialValue) {
        if (!isControlled.value) uncontrolledValue.value = nextValue;
    }

    return {
        initialValue,
        isControlled,
        value,
        setValue,
        resetValue,
    };
}
