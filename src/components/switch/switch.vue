<template>
    <label v-bind="rootAttrs">
        <input
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="inputRef"
            :name="name"
            :form="control.form ?? nativeInputAttrs.form"
            type="checkbox"
            role="switch"
            :value="value"
            :checked="controllable.value.value"
            :disabled="control.disabled || undefined"
            :required="control.required || undefined"
            :aria-checked="controllable.value.value"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
        />
        <span v-bind="getPartAttrs('track', { class: 'rp-switch__track' })">
            <span v-bind="getPartAttrs('thumb', { class: 'rp-switch__thumb' })" />
        </span>
        <span v-if="$slots.default" v-bind="getPartAttrs('label', { class: 'rp-switch__label' })">
            <slot />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useCheckedFormControl } from '@/composables/useFormControl';
import { presence, useStylesApi } from '@/styles-api';
import { useSwitch } from './useSwitch';
import type { SwitchPart, SwitchProps } from './types';

defineOptions({ name: 'RpSwitch', inheritAttrs: false });

const props = withDefaults(defineProps<SwitchProps>(), {
    modelValue: undefined,
    defaultValue: false,
    value: 'on',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const controllable = useControllableValue({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const { inputRef, control, rootClass, rootStyle, onChange, focus } = useSwitch(
    props,
    (value) => controllable.setValue(value),
    () => controllable.value.value,
);

useCheckedFormControl(
    () => inputRef.value,
    controllable,
    () => props.validationMessage,
);

const { getPartAttrs, getRootAttrs } = useStylesApi<SwitchPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        style: rootStyle.value,
        'data-disabled': presence(control.disabled),
        'data-invalid': presence(control.invalid),
        'data-state': controllable.value.value ? 'checked' : 'unchecked',
    }),
);

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { class: compatibilityClass, style: compatibilityStyle, ...forwardedAttrs } = attrs;

    return {
        ...forwardedAttrs,
        ...getPartAttrs('input', {
            class: 'rp-switch__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        'data-disabled': presence(control.disabled),
        'data-invalid': presence(control.invalid),
        onChange(event) {
            onChange(event);
            attrs.onChange?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus });
</script>

<style src="./switch.scss" lang="scss" scoped></style>
