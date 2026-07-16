import { computed, ref, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { getComponentColorValue } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import type { SwitchProps } from './types';

function getSwitchColorStyle(color: SwitchProps['color']) {
    const colorValue = getComponentColorValue(color);
    if (!colorValue) return undefined;

    return {
        '--_rp-switch-color': colorValue,
    } as CSSProperties;
}

export function useSwitch(
    props: Readonly<SwitchProps>,
    emitUpdate: (value: boolean) => void,
    getValue: () => boolean = () => props.modelValue ?? false,
) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-switch', {
            checked: getValue(),
            disabled: control.disabled,
            invalid: control.invalid,
            [`size-${props.size}`]: Boolean(props.size),
        }),
    );

    const rootStyle = computed(() => getSwitchColorStyle(props.color));

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
