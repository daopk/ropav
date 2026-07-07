import { computed, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { getComponentCustomColor, isComponentPresetColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import type { CheckboxProps } from './types';

function getCheckboxColorStyle(color: CheckboxProps['color']) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-checkbox-custom-color': customColor,
        '--_rp-checkbox-custom-on-color': 'var(--rp-color-on-primary)',
    } satisfies CSSProperties;
}

export function useCheckbox(props: Readonly<CheckboxProps>, emitUpdate: (value: boolean) => void) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-checkbox', {
            checked: props.modelValue,
            indeterminate: props.indeterminate,
            disabled: control.disabled,
            invalid: control.invalid,
            [props.variant ?? '']: Boolean(props.variant),
            [`color-${props.color}`]: isComponentPresetColor(props.color),
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
        }),
    );

    const rootStyle = computed(() => getCheckboxColorStyle(props.color));

    function onChange(e: Event) {
        emitUpdate((e.target as HTMLInputElement).checked);
    }

    return {
        control,
        rootClass,
        rootStyle,
        onChange,
    };
}
