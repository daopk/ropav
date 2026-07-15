<template>
    <div :class="rootClass" @mousedown="focusTextarea">
        <textarea
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="textareaRef"
            :name="name"
            class="rp-textarea__native"
            :value="modelValue"
            :placeholder="placeholder"
            :rows="nativeRows"
            :disabled="control.disabled || undefined"
            :readonly="readonly || undefined"
            :required="control.required || undefined"
            :aria-label="ariaLabel || undefined"
            :aria-labelledby="control.ariaLabelledby"
            :aria-describedby="control.ariaDescribedby"
            :aria-invalid="control.invalid || undefined"
            :aria-required="control.required || undefined"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type TextareaHTMLAttributes } from 'vue';
import { useTextarea } from './useTextarea';
import type { TextareaProps } from './types';

defineOptions({ name: 'RpTextarea' });

const props = withDefaults(defineProps<TextareaProps>(), {
    placeholder: '',
    rows: 3,
    resize: 'none',
    autosize: false,
    minRows: undefined,
    maxRows: undefined,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
    readonly: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const { textareaRef, control, rootClass, nativeRows, onInput, focusTextarea, focus } = useTextarea(
    props,
    (value) => {
        emit('update:modelValue', value);
    },
);

const nativeInputAttrs = computed<TextareaHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};

    return {
        ...attrs,
        onInput(event) {
            onInput(event);
            attrs.onInput?.(event);
        },
    };
});

defineExpose({ nativeElement: textareaRef, focus });
</script>

<style src="./textarea.scss" lang="scss" scoped></style>
