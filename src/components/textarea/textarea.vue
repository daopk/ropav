<template>
    <div v-bind="rootAttrs">
        <textarea
            v-bind="nativeInputAttrs"
            :id="control.id"
            ref="textareaRef"
            :name="name"
            :form="control.form ?? nativeInputAttrs.form"
            :value="controllable.value.value"
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
            :data-disabled="presence(control.disabled)"
            :data-readonly="presence(readonly)"
            :data-invalid="presence(control.invalid)"
        />
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type TextareaHTMLAttributes } from 'vue';
import { presence, useStylesApi } from '@/styles-api';
import { useControllableValue } from '@/composables/useControllableValue';
import { useFormControl } from '@/composables/useFormControl';
import { useTextarea } from './useTextarea';
import type { TextareaPart, TextareaProps } from './types';

defineOptions({ name: 'RpTextarea', inheritAttrs: false });

const props = withDefaults(defineProps<TextareaProps>(), {
    modelValue: undefined,
    defaultValue: '',
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

const controllable = useControllableValue({
    modelValue: () => props.modelValue,
    defaultValue: () => props.defaultValue,
    onChange: (value) => emit('update:modelValue', value),
});
const { textareaRef, control, rootClass, nativeRows, onInput, focusTextarea, focus } = useTextarea(
    props,
    (value) => controllable.setValue(value),
    () => controllable.value.value,
);

useFormControl({
    elements: () => [textareaRef.value],
    isControlled: () => controllable.isControlled.value,
    initializeDefault(element) {
        (element as HTMLTextAreaElement).defaultValue = controllable.initialValue;
    },
    validationMessage: () => props.validationMessage,
    readResetValue(elements) {
        controllable.resetValue((elements[0] as HTMLTextAreaElement).value);
    },
    syncControlledValue(elements) {
        (elements[0] as HTMLTextAreaElement).value = controllable.value.value;
    },
});

const { getPartAttrs, getRootAttrs } = useStylesApi<TextareaPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        onMousedown: focusTextarea,
        'data-disabled': presence(control.disabled),
        'data-readonly': presence(props.readonly),
        'data-invalid': presence(control.invalid),
    }),
);

const nativeInputAttrs = computed<TextareaHTMLAttributes>(() => {
    const {
        class: compatibilityClass,
        style: compatibilityStyle,
        onInput: compatibilityOnInput,
        ...attrs
    } = props.inputAttrs ?? {};

    return {
        ...attrs,
        ...getPartAttrs('input', {
            class: 'rp-textarea__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        onInput(event) {
            onInput(event);
            compatibilityOnInput?.(event);
        },
    };
});

defineExpose({ nativeElement: textareaRef, focus });
</script>

<style src="./textarea.scss" lang="scss" scoped></style>
