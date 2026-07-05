<template>
    <div :class="rootClass">
        <textarea
            :id="control.id"
            :name="name"
            class="rp-textarea__native"
            :value="modelValue"
            :placeholder="placeholder"
            :rows="rows"
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
    </div>
</template>

<script lang="ts" setup vapor>
import { useTextarea } from './useTextarea';
import type { TextareaProps } from './types';

defineOptions({ name: 'RpTextarea' });

const props = withDefaults(defineProps<TextareaProps>(), {
    placeholder: '',
    rows: 3,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const { control, rootClass, onInput } = useTextarea(props, (value) => {
    emit('update:modelValue', value);
});
</script>

<style src="./textarea.scss" lang="scss" scoped></style>
