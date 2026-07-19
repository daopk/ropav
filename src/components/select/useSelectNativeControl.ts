import { computed, type Ref, type SelectHTMLAttributes } from 'vue';
import { useFormControl } from '@/composables/useFormControl';
import type { SelectProps } from './types';
import { useSelectNativeValue, type SelectValue } from './useSelectNativeValue';

export function useSelectNativeControl(
    props: Readonly<SelectProps>,
    emitUpdate: (value: SelectValue) => void,
    triggerRef: Readonly<Ref<HTMLElement | null>>,
) {
    const nativeValue = useSelectNativeValue(props, emitUpdate);
    const { nativeSelectRef, controllable, getNativeValue, syncNativeSelection } = nativeValue;

    useFormControl({
        elements: () => [nativeSelectRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => props.validationMessage,
        readResetValue(elements) {
            controllable.resetValue(getNativeValue(elements[0] as HTMLSelectElement));
        },
        syncControlledValue() {
            syncNativeSelection(controllable.value.value);
        },
    });

    const nativeInputAttrs = computed<SelectHTMLAttributes>(() => {
        const {
            class: compatibilityClass,
            style: compatibilityStyle,
            onInput: compatibilityOnInput,
            onChange: compatibilityOnChange,
            onInvalid: compatibilityOnInvalid,
            ...attrs
        } = props.inputAttrs ?? {};

        return {
            ...attrs,
            class: ['rp-select__native', compatibilityClass],
            style: compatibilityStyle,
            onInput(event) {
                controllable.setValue(getNativeValue(event.currentTarget as HTMLSelectElement));
                compatibilityOnInput?.(event);
            },
            onChange(event) {
                compatibilityOnChange?.(event);
            },
            onInvalid(event) {
                event.preventDefault();
                triggerRef.value?.focus();
                compatibilityOnInvalid?.(event);
            },
        };
    });

    return {
        nativeSelectRef,
        selectedValue: controllable.value,
        nativeInputAttrs,
        requestValueUpdate: nativeValue.requestValueUpdate,
    };
}
