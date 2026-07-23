import { computed, ref } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { getComponentCheckedColorStyle } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import type { CheckboxProps } from './types';

export function useCheckbox(
    props: Readonly<CheckboxProps>,
    emitUpdate: (value: boolean) => void,
    getValue: () => boolean = () => props.modelValue ?? false,
) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-checkbox', {
            checked: getValue(),
            indeterminate: props.indeterminate,
            disabled: control.disabled,
            invalid: control.invalid,
            [props.variant ?? '']: Boolean(props.variant),
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
        }),
    );

    const rootStyle = computed(() =>
        getComponentCheckedColorStyle({
            color: props.color,
            autoContrast: props.autoContrast,
            contrastColor: props.contrastColor,
            colorProperty: '--_rp-checkbox-color',
            checkedColorProperty: '--_rp-checkbox-on-color',
        }),
    );

    function onChange(e: Event) {
        emitUpdate((e.target as HTMLInputElement).checked);
    }

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    return {
        inputRef,
        control,
        rootClass,
        rootStyle,
        onChange,
        focus,
    };
}
