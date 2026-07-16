<template>
    <label v-bind="rootAttrs">
        <span v-if="$slots.left" v-bind="getPartAttrs('left', { class: 'rp-input__left' })">
            <slot name="left" />
        </span>
        <input v-bind="nativeInputAttrs" ref="inputRef" />
        <span v-if="$slots.right" v-bind="getPartAttrs('right', { class: 'rp-input__right' })">
            <slot name="right" />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useControllableValue } from '@/composables/useControllableValue';
import { claimNestedFormControlOwner, useTextFormControl } from '@/composables/useFormControl';
import { useInput } from './useInput';
import type { InputPart, InputProps } from './types';

defineOptions({ name: 'RpInput', inheritAttrs: false });

const props = withDefaults(defineProps<InputProps>(), {
    modelValue: undefined,
    defaultValue: '',
    type: 'text',
    placeholder: '',
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const controllable = useControllableValue({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const { inputRef, control, rootClass, onInput, focusInput } = useInput(props, (value) => {
    controllable.setValue(value);
});
const hasNestedFormControlOwner = claimNestedFormControlOwner();

if (!hasNestedFormControlOwner) {
    useTextFormControl(
        () => inputRef.value,
        controllable,
        () => props.validationMessage,
    );
}

const { getPartAttrs, getRootAttrs } = useStylesApi<InputPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onMousedown: focusInput,
        'data-disabled': presence(control.disabled),
        'data-readonly': presence(props.readonly),
        'data-invalid': presence(control.invalid),
    }),
);

const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { class: compatibilityClass, style: compatibilityStyle, ...forwardedAttrs } = attrs;

    return {
        ...forwardedAttrs,
        ...getPartAttrs('input', {
            class: 'rp-input__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        id: control.id,
        name: props.name,
        form: control.form ?? forwardedAttrs.form,
        type: props.type,
        value: controllable.value.value,
        placeholder: props.placeholder,
        disabled: control.disabled || undefined,
        readonly: props.readonly || undefined,
        required: control.required || undefined,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'data-disabled': presence(control.disabled),
        'data-readonly': presence(props.readonly),
        'data-invalid': presence(control.invalid),
        onInput(event) {
            onInput(event);
            attrs.onInput?.(event);
        },
    };
});

defineExpose({ nativeElement: inputRef, focus: () => inputRef.value?.focus() });
</script>

<style src="./input.scss" lang="scss" scoped></style>
