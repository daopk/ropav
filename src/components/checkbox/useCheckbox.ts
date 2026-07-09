import { computed, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { getComponentColorValue, getComponentContrastColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import type { CheckboxProps } from './types';

function getCheckboxColorStyle(
    color: CheckboxProps['color'],
    autoContrast: CheckboxProps['autoContrast'],
) {
    const colorValue = getComponentColorValue(color);
    if (color && !colorValue) return undefined;
    if (!colorValue && !autoContrast) return undefined;

    const style: CSSProperties = {};
    if (colorValue) style['--_rp-checkbox-color'] = colorValue;
    if (autoContrast) {
        style['--_rp-checkbox-on-color'] = getComponentContrastColor(color ?? 'primary', {
            autoContrast,
        });
    }

    return style;
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
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
        }),
    );

    const rootStyle = computed(() => getCheckboxColorStyle(props.color, props.autoContrast));

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
