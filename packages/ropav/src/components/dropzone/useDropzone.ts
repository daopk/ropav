import { computed, ref } from 'vue';
import { useControlState } from '@/internal/composables/useControlState';
import { useNativeFileSelection } from '@/internal/composables/useNativeFileSelection';
import { bem } from '@/utils/bem';
import { createDropzonePolicy } from './dropzoneModel';
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

function readTransferItems(transfer: DataTransfer | null) {
    if (!transfer) return [];
    return Array.from(transfer.items, ({ kind, type }) => ({ kind, type }));
}

export function useDropzone(props: Readonly<DropzoneProps>, callbacks: DropzoneCallbacks) {
    const rootRef = ref<HTMLElement | null>(null);
    const control = useControlState(props);
    const {
        inputRef,
        files,
        settleSelection,
        clear: clearNativeFiles,
        focus,
        open,
    } = useNativeFileSelection({
        modelValue: () => props.modelValue,
        multiple: () => props.multiple !== false,
        disabled: () => control.disabled,
        validationMessage: () => props.validationMessage,
        onChange: callbacks.onUpdate,
    });
    const dragDepth = ref(0);
    const dragFiles = ref<File[]>([]);
    const dragItems = ref<ReturnType<typeof readTransferItems>>([]);
    const lastRejections = ref<DropzoneFileRejection[]>([]);

    const policy = computed(() =>
        createDropzonePolicy({
            accept: props.accept,
            multiple: props.multiple ?? true,
            maxFiles: props.maxFiles,
            maxSize: props.maxSize,
        }),
    );
    const dragSelection = computed(() => policy.value.commit(dragFiles.value));
    const status = computed<DropzoneStatus>(() => {
        if (dragDepth.value === 0) return 'idle';
        if (dragSelection.value.rejections.length > 0) return 'reject';
        return policy.value.preview(dragItems.value);
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

    function submitFiles(nextFiles: File[]) {
        const selection = policy.value.commit(nextFiles);
        lastRejections.value = selection.rejections;

        settleSelection(
            selection.acceptedFiles.length > 0 || selection.rejections.length === 0
                ? { status: 'accepted', files: selection.acceptedFiles }
                : { status: 'rejected' },
        );

        callbacks.onDrop(selection);
        if (selection.rejections.length > 0) callbacks.onReject(selection.rejections);
    }

    function resetDrag() {
        dragDepth.value = 0;
        dragFiles.value = [];
        dragItems.value = [];
    }

    function onDragenter(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();
        if (control.disabled) return;

        dragDepth.value += 1;
        dragFiles.value = readTransferFiles(event.dataTransfer);
        dragItems.value = readTransferItems(event.dataTransfer);
    }

    function onDragover(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();
        if (control.disabled) return;

        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        const nextFiles = readTransferFiles(event.dataTransfer);
        const nextItems = readTransferItems(event.dataTransfer);
        if (nextFiles.length > 0) dragFiles.value = nextFiles;
        if (nextItems.length > 0) dragItems.value = nextItems;
    }

    function onDragleave() {
        if (control.disabled || dragDepth.value === 0) return;
        dragDepth.value = Math.max(0, dragDepth.value - 1);
        if (dragDepth.value === 0) {
            dragFiles.value = [];
            dragItems.value = [];
        }
    }

    function onDrop(event: DragEvent) {
        if (!hasFileTransfer(event.dataTransfer)) return;
        event.preventDefault();

        const nextFiles = readTransferFiles(event.dataTransfer);
        resetDrag();
        if (!control.disabled) submitFiles(nextFiles);
    }

    function clear() {
        lastRejections.value = [];
        clearNativeFiles();
    }

    function onChange(event: Event) {
        submitFiles(Array.from((event.target as HTMLInputElement).files ?? []));
    }

    function onKeydown(event: KeyboardEvent) {
        if (props.activateOnKeyboard === false && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
        }
    }

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
        onKeydown,
        open,
        clear,
        focus,
    };
}
