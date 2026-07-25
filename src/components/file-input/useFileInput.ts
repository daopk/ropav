import { computed, nextTick, ref, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { replaceInputFiles } from '@/utils/dom/files';
import { normalizeSelectedFiles, readSelectedFiles } from './fileInputModel';
import type { FileInputProps } from './types';

export function useFileInput(props: Readonly<FileInputProps>, emitUpdate: (value: File[]) => void) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);
    const controllable = useControllableValue<File[]>({
        modelValue: () => props.modelValue,
        defaultValue: () => [],
        onChange: emitUpdate,
    });

    const files = computed(() =>
        normalizeSelectedFiles(controllable.value.value, props.multiple ?? false),
    );
    const fileNames = computed(() => files.value.map((file) => file.name));
    const hasFiles = computed(() => files.value.length > 0);
    const rootClass = computed(() =>
        bem('rp-file-input', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            filled: hasFiles.value,
        }),
    );
    const buttonText = computed(
        () => props.buttonLabel ?? (props.multiple ? 'Choose files' : 'Choose file'),
    );
    const displayValue = computed(() => {
        if (hasFiles.value) return fileNames.value.join(', ');
        return props.placeholder ?? (props.multiple ? 'No files selected' : 'No file selected');
    });

    function syncNativeFiles() {
        const input = inputRef.value;
        if (input) replaceInputFiles(input, files.value);
    }

    function requestFiles(nextFiles: File[]) {
        controllable.setValue(normalizeSelectedFiles(nextFiles, props.multiple ?? false));
        void nextTick(syncNativeFiles);
    }

    function onChange(event: Event) {
        const input = event.target as HTMLInputElement;
        requestFiles(readSelectedFiles(input.files, props.multiple ?? false));
    }

    function clear() {
        requestFiles([]);
    }

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    function open() {
        if (control.disabled) return;
        inputRef.value?.click();
    }

    watch(files, syncNativeFiles, { flush: 'post', immediate: true });

    useFormControl({
        elements: () => [inputRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: () => props.validationMessage,
        readResetValue: () => controllable.resetValue([]),
        syncControlledValue: syncNativeFiles,
    });

    return {
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
    };
}
