import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { CheckboxProps } from './types';

export function useCheckbox(
    props: Readonly<CheckboxProps>,
    emitUpdate: (value: boolean) => void,
) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-checkbox', {
            checked: props.modelValue,
            indeterminate: props.indeterminate,
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    function onChange(e: Event) {
        emitUpdate((e.target as HTMLInputElement).checked);
    }

    return {
        control,
        rootClass,
        onChange,
    };
}
