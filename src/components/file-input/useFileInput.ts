import { computed } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { useNativeFileSelection } from '@/internal/composables/useNativeFileSelection';
import { bem } from '@/utils/bem';
import type { FileInputProps } from './types';

export function useFileInput(props: Readonly<FileInputProps>, emitUpdate: (value: File[]) => void) {
    const control = useControlState(props);
    const { inputRef, files, settleSelection, clear, focus, open } = useNativeFileSelection({
        modelValue: () => props.modelValue,
        multiple: () => props.multiple ?? false,
        disabled: () => control.disabled,
        validationMessage: () => props.validationMessage,
        onChange: emitUpdate,
    });

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

    function onChange(event: Event) {
        const input = event.target as HTMLInputElement;
        settleSelection({ status: 'accepted', files: input.files ?? [] });
    }

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
