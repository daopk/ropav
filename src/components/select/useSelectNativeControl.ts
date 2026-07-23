import { computed, type Ref, type SelectHTMLAttributes } from 'vue';
import { useFormControl } from '@/internal/composables/useFormControl';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
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
        const compatibilityAttrs = props.inputAttrs ?? {};
        const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
            splitCompatibilityAttributes(compatibilityAttrs);

        return {
            ...forwardedAttributes,
            class: ['rp-select__native', compatibilityClass],
            style: compatibilityStyle,
            onInput: composeEventHandlers<InputEvent>(
                (event) =>
                    controllable.setValue(getNativeValue(event.currentTarget as HTMLSelectElement)),
                compatibilityAttrs.onInput,
            ),
            onChange: compatibilityAttrs.onChange,
            onInvalid: composeEventHandlers<Event>((event) => {
                event.preventDefault();
                triggerRef.value?.focus();
            }, compatibilityAttrs.onInvalid),
        };
    });

    return {
        nativeSelectRef,
        selectedValue: controllable.value,
        nativeInputAttrs,
        requestValueUpdate: nativeValue.requestValueUpdate,
    };
}
