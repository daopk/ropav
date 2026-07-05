import { computed, provide, useId } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { useRequiredInject } from '@/composables/useRequiredInject';
import { bem } from '@/utils/bem';
import { radioGroupKey } from './types';
import type { RadioGroupContext, RadioGroupProps, RadioProps } from './types';

export function useRadio(props: Readonly<RadioProps>) {
    const group = useRequiredInject(radioGroupKey, 'RpRadio');
    const isChecked = computed(() => group.modelValue === props.value);
    const isDisabled = computed(() => props.disabled || group.disabled);

    const rootClass = computed(() =>
        bem('rp-radio', {
            checked: isChecked.value,
            disabled: isDisabled.value,
        }),
    );

    function onSelect() {
        if (isDisabled.value) return;
        group.select(props.value);
    }

    return {
        group,
        isChecked,
        isDisabled,
        rootClass,
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
        select(value) {
            emitUpdate(value);
        },
    });

    return {
        control,
        rootClass,
    };
}
