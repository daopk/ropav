import { ref, watchEffect } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import type { SelectProps } from './types';

export type SelectValue = string | number | null;

export function useSelectNativeValue(
    props: Readonly<SelectProps>,
    emitUpdate: (value: SelectValue) => void,
) {
    const nativeSelectRef = ref<HTMLSelectElement | null>(null);
    const controllable = useControllableValue<SelectValue>({
        modelValue: () => props.modelValue,
        defaultValue: () => props.defaultValue ?? null,
        onChange: emitUpdate,
    });

    function getNativeValue(select: HTMLSelectElement) {
        if (select.selectedIndex <= 0) return null;
        return props.options?.[select.selectedIndex - 1]?.value ?? null;
    }

    function syncNativeSelection(value: SelectValue) {
        const select = nativeSelectRef.value;
        if (!select) return;

        const optionIndex = props.options?.findIndex((option) => option.value === value) ?? -1;
        select.selectedIndex = optionIndex + 1;
    }

    function syncNativeDefaultSelection() {
        const select = nativeSelectRef.value;
        if (!select) return;

        const optionIndex =
            props.options?.findIndex((option) => option.value === controllable.initialValue) ?? -1;
        for (const [index, option] of [...select.options].entries()) {
            option.defaultSelected = index === optionIndex + 1;
        }
    }

    function requestValueUpdate(value: SelectValue) {
        const select = nativeSelectRef.value;
        if (!select) {
            controllable.setValue(value);
            return;
        }

        syncNativeSelection(value);
        select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

        if (controllable.isControlled.value) {
            queueMicrotask(() => syncNativeSelection(controllable.value.value));
        }
    }

    watchEffect(syncNativeDefaultSelection, { flush: 'post' });
    watchEffect(() => syncNativeSelection(controllable.value.value), { flush: 'post' });

    return {
        nativeSelectRef,
        controllable,
        getNativeValue,
        syncNativeSelection,
        requestValueUpdate,
    };
}
