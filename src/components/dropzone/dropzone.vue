<template>
    <div v-bind="rootAttrs" ref="rootRef">
        <input v-bind="nativeInputAttrs" ref="inputRef" />
        <div v-bind="getPartAttrs('content', { class: 'rp-dropzone__content' })">
            <slot
                :files="files"
                :rejections="rejections"
                :status="status"
                :dragging="status !== 'idle'"
                :open="open"
                :clear="clear"
            >
                <p v-bind="getPartAttrs('label', { class: 'rp-dropzone__label' })">
                    {{ displayLabel }}
                </p>
                <p
                    v-if="description"
                    v-bind="getPartAttrs('description', { class: 'rp-dropzone__description' })"
                >
                    {{ description }}
                </p>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts" vapor>
import { computed, type InputHTMLAttributes } from 'vue';
import { useStylesApi } from '@/styles-api';
import { toPresenceAttribute } from '@/utils/attributes';
import { composeEventHandlers, splitCompatibilityAttributes } from '@/utils/dom/attributes';
import { useDropzone } from './useDropzone';
import type {
    DropzoneFileRejection,
    DropzonePart,
    DropzoneProps,
    DropzoneSelection,
    DropzoneSlotProps,
} from './types';

defineOptions({ name: 'RpDropzone', inheritAttrs: false });

const props = withDefaults(defineProps<DropzoneProps>(), {
    modelValue: undefined,
    accept: undefined,
    capture: undefined,
    multiple: true,
    maxFiles: undefined,
    maxSize: undefined,
    size: undefined,
    radius: undefined,
    label: undefined,
    description: undefined,
    activateOnClick: true,
    activateOnKeyboard: true,
    disabled: undefined,
    required: undefined,
    invalid: undefined,
    valid: undefined,
});

const emit = defineEmits<{
    'update:modelValue': [files: File[]];
    drop: [selection: DropzoneSelection];
    reject: [rejections: DropzoneFileRejection[]];
}>();

defineSlots<{
    default?(props: DropzoneSlotProps): unknown;
}>();

const {
    rootRef,
    inputRef,
    control,
    files,
    rejections,
    status,
    rootClass,
    onDragenter,
    onDragover,
    onDragleave,
    onDrop,
    onChange,
    open,
    clear,
    focus,
} = useDropzone(props, {
    onUpdate: (nextFiles) => emit('update:modelValue', nextFiles),
    onDrop: (selection) => emit('drop', selection),
    onReject: (nextRejections) => emit('reject', nextRejections),
});

const displayLabel = computed(() => {
    if (props.label) return props.label;
    if (status.value === 'accept') return 'Drop files here';
    if (status.value === 'reject') return 'Some files are not accepted';
    return props.multiple
        ? 'Drag files here or click to browse'
        : 'Drag a file here or click to browse';
});

const { getPartAttrs, getRootAttrs } = useStylesApi<DropzonePart>(props, 'root');
const rootAttrs = computed(() =>
    getRootAttrs({
        class: rootClass.value,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        'data-filled': toPresenceAttribute(files.value.length > 0),
        'data-dragging': toPresenceAttribute(status.value !== 'idle'),
        'data-state': status.value,
        onDragenter,
        onDragover,
        onDragleave,
        onDrop,
    }),
);
const nativeInputAttrs = computed<InputHTMLAttributes>(() => {
    const attrs = props.inputAttrs ?? {};
    const { compatibilityClass, compatibilityStyle, forwardedAttributes } =
        splitCompatibilityAttributes(attrs);

    return {
        ...forwardedAttributes,
        ...getPartAttrs('input', {
            class: 'rp-dropzone__input',
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
        tabindex: props.activateOnKeyboard ? undefined : -1,
        'aria-label': control.ariaLabelledby ? undefined : props.ariaLabel || displayLabel.value,
        'aria-labelledby': control.ariaLabelledby,
        'aria-describedby': control.ariaDescribedby,
        'aria-invalid': control.invalid || undefined,
        'aria-required': control.required || undefined,
        'data-disabled': toPresenceAttribute(control.disabled),
        'data-invalid': toPresenceAttribute(control.invalid),
        onChange: composeEventHandlers(onChange, attrs.onChange),
    };
});

defineExpose({ nativeElement: inputRef, rootElement: rootRef, open, clear, focus });
</script>

<style src="./dropzone.scss" lang="scss" scoped></style>
