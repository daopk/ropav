import { computed, inject, provide, ref, useId, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { getComponentColorValue, getComponentContrastColor } from '@/utils/componentColors';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type { RadioGroupContext, RadioGroupProps, RadioProps } from './types';

function getRadioColorStyle(color: RadioProps['color'], autoContrast: RadioProps['autoContrast']) {
    const colorValue = getComponentColorValue(color);
    if (color && !colorValue) return undefined;
    if (!colorValue && !autoContrast) return undefined;

    const style: CSSProperties = {};
    if (colorValue) style['--_rp-radio-color'] = colorValue;
    if (autoContrast) {
        style['--_rp-radio-on-color'] = getComponentContrastColor(color ?? 'primary', {
            autoContrast,
        });
    }

    return style;
}

export function useRadio(props: Readonly<RadioProps>, emitChange: (event: Event) => void) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);
    const group = inject(radioGroupKey, null);
    const isChecked = computed(
        () => props.checked ?? (group ? group.modelValue === props.value : false),
    );
    const isDisabled = computed(() => Boolean(props.disabled || group?.disabled));
    const isRequired = computed(() => props.required ?? group?.required ?? false);
    const isInvalid = computed(() => props.invalid ?? group?.invalid ?? false);
    const name = computed(() => props.name ?? group?.name);
    const variant = computed(() => props.variant ?? group?.variant);
    const color = computed(() => props.color ?? group?.color);
    const autoContrast = computed(() => props.autoContrast ?? group?.autoContrast);
    const size = computed(() => props.size ?? group?.size);

    const rootClass = computed(() =>
        bem('rp-radio', {
            checked: isChecked.value,
            disabled: isDisabled.value,
            invalid: isInvalid.value,
            [variant.value ?? '']: Boolean(variant.value),
            [`size-${size.value}`]: Boolean(size.value),
        }),
    );

    const rootStyle = computed(() => getRadioColorStyle(color.value, autoContrast.value));

    function onSelect(event: Event) {
        if (isDisabled.value) return;
        group?.select(props.value);
        emitChange(event);
    }

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    return {
        inputRef,
        control,
        name,
        isChecked,
        isDisabled,
        isRequired,
        isInvalid,
        rootClass,
        rootStyle,
        onSelect,
        focus,
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
        get invalid() {
            return control.invalid;
        },
        get variant() {
            return props.variant;
        },
        get color() {
            return props.color;
        },
        get autoContrast() {
            return props.autoContrast;
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
