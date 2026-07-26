<template>
    <div v-bind="rootAttrs">
        <input v-bind="nativeInputAttrs" ref="inputRef" />
        <span
            v-bind="getPartAttrs('trigger', { class: 'rp-file-input__trigger' })"
            aria-hidden="true"
        >
            <slot name="trigger" :files="files" :multiple="multiple">{{ buttonText }}</slot>
        </span>
        <span
            v-bind="
                getPartAttrs('value', {
                    class: [
                        'rp-file-input__value',
                        { 'rp-file-input__value--placeholder': !hasFiles },
                    ],
                })
            "
            aria-hidden="true"
        >
            <slot name="value" :files="files" :file-names="fileNames" :has-files="hasFiles">{{
                displayValue
            }}</slot>
        </span>
    </div>
</template>

<script lang="ts" setup vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import { useFileInput } from './useFileInput';
import type {
    FileInputPart,
    FileInputProps,
    FileInputTriggerSlotProps,
    FileInputValueSlotProps,
} from './types';

defineOptions({ name: 'RpFileInput', inheritAttrs: false });

const props = withDefaults(defineProps<FileInputProps>(), {
    modelValue: undefined,
    accept: undefined,
    capture: undefined,
    multiple: false,
    buttonLabel: undefined,
    placeholder: undefined,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [value: File[]];
}>();

defineSlots<{
    trigger?(props: FileInputTriggerSlotProps): unknown;
    value?(props: FileInputValueSlotProps): unknown;
}>();

const {
    inputRef,
    control,
    files,
    fileNames,
    hasFiles,
    rootClass,
    buttonText,
    displayValue,
    onChange,
    clear,
    focus,
    open,
} = useFileInput(props, (value) => emit('update:modelValue', value));

const { getPartAttrs, getRootAttrs } = useStylesApi<FileInputPart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
    }),
);
const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attrs);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-file-input__native',
            compatibilityClass,
            compatibilityStyle,
        }),
        id: control.id,
        name: props.name,
        form: control.form ?? forwardedAttributes.form,
        type: 'file',
        value: undefined,
        accept: props.accept,
        capture: props.capture,
        multiple: props.multiple || undefined,
        disabled: control.disabled || undefined,
        required: control.required || undefined,
        'aria-label': props.ariaLabel || undefined,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        onChange: composeEventHandlers(onChange, attrs.onChange),
    };
});

defineExpose({ nativeElement: inputRef, clear, focus, open });
</script>

<style src="./file-input.scss" lang="scss" scoped></style>
