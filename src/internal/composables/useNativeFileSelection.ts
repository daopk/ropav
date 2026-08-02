import { computed, nextTick, ref, watchEffect, type ComputedRef, type Ref } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { normalizeSelectedFiles, replaceInputFiles } from '@/utils/dom/files';
import { useFormControl } from './useFormControl';

export interface NativeFileSelectionOptions {
    modelValue: () => File[] | undefined;
    multiple: () => boolean;
    disabled: () => boolean;
    validationMessage?: () => string | undefined;
    onChange: (files: File[]) => void;
}

export type NativeFileSelectionOutcome =
    | { status: 'accepted'; files: Iterable<File> }
    | { status: 'rejected' };

export interface NativeFileSelection {
    inputRef: Ref<HTMLInputElement | null>;
    files: ComputedRef<File[]>;
    settleSelection: (outcome: NativeFileSelectionOutcome) => void;
    clear: () => void;
    focus: (options?: FocusOptions) => void;
    open: () => void;
}

export function useNativeFileSelection(
    options: Readonly<NativeFileSelectionOptions>,
): NativeFileSelection {
    const inputRef = ref<HTMLInputElement | null>(null);
    const controllable = useControllableValue<File[]>({
        modelValue: options.modelValue,
        defaultValue: () => [],
        onChange: options.onChange,
    });
    const files = computed(() =>
        normalizeSelectedFiles(controllable.value.value, options.multiple()),
    );

    function syncNativeFiles(nextFiles: readonly File[] = files.value) {
        const input = inputRef.value;
        if (input) replaceInputFiles(input, nextFiles);
    }

    function settleSelection(outcome: NativeFileSelectionOutcome) {
        if (outcome.status === 'accepted') {
            const nextFiles = normalizeSelectedFiles(outcome.files, options.multiple());
            syncNativeFiles(nextFiles);
            controllable.setValue(nextFiles);
        } else {
            syncNativeFiles();
        }

        void nextTick(() => syncNativeFiles());
    }

    function clear() {
        settleSelection({ status: 'accepted', files: [] });
    }

    function focus(focusOptions?: FocusOptions) {
        inputRef.value?.focus(focusOptions);
    }

    function open() {
        if (options.disabled()) return;
        inputRef.value?.click();
    }

    watchEffect(() => syncNativeFiles(files.value), { flush: 'post' });

    useFormControl({
        elements: () => [inputRef.value],
        isControlled: () => controllable.isControlled.value,
        validationMessage: options.validationMessage,
        readResetValue() {
            controllable.resetValue([]);
            settleSelection({ status: 'rejected' });
        },
        syncControlledValue: () => settleSelection({ status: 'rejected' }),
    });

    return {
        inputRef,
        files,
        settleSelection,
        clear,
        focus,
        open,
    };
}
