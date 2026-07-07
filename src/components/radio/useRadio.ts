import { computed, provide, useId, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { getComponentCustomColor, isComponentPresetColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type { RadioGroupContext, RadioGroupProps, RadioProps } from './types';

function getRadioColorStyle(color: RadioProps['color']) {
    const customColor = getComponentCustomColor(color);
    if (!customColor) return undefined;

    return {
        '--_rp-radio-custom-color': customColor,
        '--_rp-radio-custom-on-color': 'var(--rp-color-on-primary)',
    } satisfies CSSProperties;
}

export function useRadio(props: Readonly<RadioProps>) {
    const group = useRequiredInject(radioGroupKey, 'RpRadio');
    const isChecked = computed(() => group.modelValue === props.value);
    const isDisabled = computed(() => props.disabled || group.disabled);
    const variant = computed(() => props.variant ?? group.variant);
    const color = computed(() => props.color ?? group.color);
    const size = computed(() => props.size ?? group.size);

    const rootClass = computed(() =>
        bem('rp-radio', {
            checked: isChecked.value,
            disabled: isDisabled.value,
            [variant.value ?? '']: Boolean(variant.value),
            [`color-${color.value}`]: isComponentPresetColor(color.value),
            [`size-${size.value}`]: Boolean(size.value),
        }),
    );

    const rootStyle = computed(() => getRadioColorStyle(color.value));

    function onSelect() {
        if (isDisabled.value) return;
        group.select(props.value);
    }

    return {
        group,
        isChecked,
        isDisabled,
        rootClass,
        rootStyle,
        onSelect,
    };
}

export function useRadioGroup(
    props: Readonly<RadioGroupProps>,
    emitUpdate: (value: string | number | null) => void,
) {
    const control = useControlState(props);

    const rootClass = computed(() =>
        bem('rp-radio-group', {
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const generatedName = useId();
    const groupName = computed(() => props.name ?? `${control.id ?? generatedName}-radio`);

    provide<RadioGroupContext>(radioGroupKey, {
        get modelValue() {
            return props.modelValue;
        },
        get name() {
            return groupName.value;
        },
        get disabled() {
            return control.disabled;
        },
        get required() {
            return control.required;
        },
        get variant() {
            return props.variant;
        },
        get color() {
            return props.color;
        },
        get size() {
            return props.size;
        },
        select(value) {
            emitUpdate(value);
        },
    });

    return {
        control,
        rootClass,
    };
}
