import { computed, shallowRef, watch } from 'vue';

export interface ControllableValueOptions<T> {
    modelValue: () => T | undefined;
    defaultValue: () => T;
    onChange: (value: T) => void;
}

export function useControllableValue<T>(options: ControllableValueOptions<T>) {
    const initialValue = options.defaultValue();
    const uncontrolledValue = shallowRef<T>(initialValue);
    const isControlled = computed(() => options.modelValue() !== undefined);

    watch(
        options.modelValue,
        (value) => {
            if (value !== undefined) uncontrolledValue.value = value;
        },
        { immediate: true },
    );

    const value = computed<T>(() => options.modelValue() ?? uncontrolledValue.value);

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
