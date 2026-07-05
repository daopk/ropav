import { computed } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import type { SwitchProps } from './types';

export function useSwitch(
    props: Readonly<SwitchProps>,
    emitUpdate: (value: boolean) => void,
) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-switch', {
            checked: props.modelValue,
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
