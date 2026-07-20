import { computed, ref, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { getComponentColorValue, getComponentContrastColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import type { CheckboxProps } from './types';

function getCheckboxColorStyle(
    color: CheckboxProps['color'],
    autoContrast: CheckboxProps['autoContrast'],
    contrastColor: CheckboxProps['contrastColor'],
) {
    const colorValue = getComponentColorValue(color);
    if (color && !colorValue) return undefined;
    if (!colorValue && autoContrast === false && contrastColor === undefined) return undefined;

    const style: CSSProperties = {};
    if (colorValue) style['--_rp-checkbox-color'] = colorValue;
    if (autoContrast !== false || contrastColor !== undefined) {
        style['--_rp-checkbox-on-color'] = getComponentContrastColor(color ?? 'primary', {
            autoContrast,
            contrastColor,
        });
    }

    return style;
}

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
        getCheckboxColorStyle(props.color, props.autoContrast, props.contrastColor),
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
