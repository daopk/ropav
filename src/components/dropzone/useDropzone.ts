import { computed, nextTick, ref, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import { useControlState } from '@/internal/composables/useControlState';
import { useFormControl } from '@/internal/composables/useFormControl';
import { bem } from '@/utils/bem';
import { replaceInputFiles } from '@/utils/dom/files';
import { processDropzoneFiles } from './dropzoneModel';
import type {
    DropzoneFileRejection,
    DropzoneProps,
    DropzoneSelection,
    DropzoneStatus,
} from './types';

interface DropzoneCallbacks {
    onUpdate: (files: File[]) => void;
    onDrop: (selection: DropzoneSelection) => void;
    onReject: (rejections: DropzoneFileRejection[]) => void;
}

function hasFileTransfer(transfer: DataTransfer | null) {
    return Boolean(
        transfer &&
        (Array.from(transfer.types).includes('Files') ||
            transfer.files.length > 0 ||
            Array.from(transfer.items).some((item) => item.kind === 'file')),
    );
}

function readTransferFiles(transfer: DataTransfer | null) {
    if (!transfer) return [];

    const files = Array.from(transfer.files);
    if (files.length > 0) return files;

    return Array.from(transfer.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
}

export function useDropzone(props: Readonly<DropzoneProps>, callbacks: DropzoneCallbacks) {
    const rootRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const control = useControlState(props);
    const controllable = useControllableValue<File[]>({
        modelValue: () => props.modelValue,
        defaultValue: () => [],
        onChange: callbacks.onUpdate,
    });
    const dragDepth = ref(0);
    const dragFiles = ref<File[]>([]);
    const lastRejections = ref<DropzoneFileRejection[]>([]);

    const files = computed(() => {
        const selectedFiles = Array.from(controllable.value.value);
        return props.multiple !== false ? selectedFiles : selectedFiles.slice(0, 1);
    });
    const selectionOptions = computed(() => ({
        accept: props.accept,
        multiple: props.multiple ?? true,
        maxFiles: props.maxFiles,
        maxSize: props.maxSize,
    }));
    const dragSelection = computed(() =>
        processDropzoneFiles(dragFiles.value, selectionOptions.value),
    );
    const status = computed<DropzoneStatus>(() => {
        if (dragDepth.value === 0) return 'idle';
        return dragSelection.value.rejections.length > 0 ? 'reject' : 'accept';
    });
    const rejections = computed(() =>
        status.value === 'idle' ? lastRejections.value : dragSelection.value.rejections,
    );
    const rootClass = computed(() =>
        bem('rp-dropzone', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: control.disabled,
            invalid: control.invalid,
            valid: control.valid && !control.invalid,
            filled: files.value.length > 0,
            dragging: status.value !== 'idle',
            accept: status.value === 'accept',
            reject: status.value === 'reject',
            'click-disabled': !props.activateOnClick,
        }),
    );

    function syncNativeFiles() {
        const input = inputRef.value;
        if (input) replaceInputFiles(input, files.value);
    }

    function requestFiles(nextFiles: File[]) {
        controllable.setValue(props.multiple !== false ? nextFiles : nextFiles.slice(0, 1));
        void nextTick(syncNativeFiles);
    }

    function submitFiles(nextFiles: File[]) {
        const selection = processDropzoneFiles(nextFiles, selectionOptions.value);
        lastRejections.value = selection.rejections;

        if (selection.acceptedFiles.length > 0 || selection.rejections.length === 0) {
            requestFiles(selection.acceptedFiles);
        } else {
            void nextTick(syncNativeFiles);
        }

        callbacks.onDrop(selection);
        if (selection.rejections.length > 0) callbacks.onReject(selection.rejections);
    }

    function resetDrag() {
        dragDepth.value = 0;
        dragFiles.value = [];
    }

    function onDragenter(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();
        if (control.disabled) return;

        dragDepth.value += 1;
        dragFiles.value = readTransferFiles(event.dataTransfer);
    }

    function onDragover(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();
        if (control.disabled) return;

        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        const nextFiles = readTransferFiles(event.dataTransfer);
        if (nextFiles.length > 0) dragFiles.value = nextFiles;
    }

    function onDragleave() {
        if (control.disabled || dragDepth.value === 0) return;
        dragDepth.value = Math.max(0, dragDepth.value - 1);
        if (dragDepth.value === 0) dragFiles.value = [];
    }

    function onDrop(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();

        const nextFiles = readTransferFiles(event.dataTransfer);
        resetDrag();
        if (!control.disabled) submitFiles(nextFiles);
    }

    function open() {
        if (control.disabled) return;
        inputRef.value?.click();
    }

    function clear() {
        lastRejections.value = [];
        requestFiles([]);
    }

    function focus(options?: FocusOptions) {
        inputRef.value?.focus(options);
    }

    function onChange(event: Event) {
        submitFiles(Array.from((event.target as HTMLInputElement).files ?? []));
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
    };
}
