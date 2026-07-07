<template>
    <label :class="rootClass" @mousedown="focusInput">
        <span v-if="$slots.left" class="rp-input__left">
            <slot name="left" />
        </span>
        <input
            :id="control.id"
            ref="inputRef"
            :name="name"
            class="rp-input__native"
            :type="type"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="control.disabled || undefined"
            :readonly="readonly || undefined"
            :required="control.required || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
            @input="onInput"
        />
        <span v-if="$slots.right" class="rp-input__right">
            <slot name="right" />
        </span>
    </label>
</template>

<script lang="ts" setup vapor>
import { useInput } from './useInput';
import type { InputProps } from './types';

defineOptions({ name: 'RpInput' });

const props = withDefaults(defineProps<InputProps>(), {
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

const { inputRef, control, rootClass, onInput, focusInput } = useInput(props, (value) => {
    emit('update:modelValue', value);
});

void inputRef;
</script>

<style src="./input.scss" lang="scss" scoped></style>
