import { computed, ref, toValue, watch } from 'vue';
import { useControllableValue } from '@/composables/useControllableValue';
import type {
    ToastCloseReason,
    ToastStateOption,
    UseToastStateOptions,
    UseToastStateReturn,
} from './types';

function optionValue<T>(value: ToastStateOption<T | undefined> | undefined) {
    return toValue(value);
}

export function useToastState(options: Readonly<UseToastStateOptions> = {}): UseToastStateReturn {
    const closeReason = ref<ToastCloseReason | null>(null);

    const controlledOpen = computed(() => optionValue<boolean>(options.open));
    const controllableOpen = useControllableValue({
        modelValue: () => controlledOpen.value,
        defaultValue: () => options.defaultOpen ?? false,
        onChange: (nextOpen) => options.onOpenChange?.(nextOpen),
    });
    const isOpen = controllableOpen.value;
    const lastCloseReason = computed(() => closeReason.value);

    watch(
        controlledOpen,
        (nextOpen) => {
            if (nextOpen === undefined) return;

            if (nextOpen) closeReason.value = null;
        },
        { flush: 'sync', immediate: true },
    );

    const toastProps = computed(() => ({
        open: isOpen.value,
        'onUpdate:open': setOpen,
        onClose: handleToastClose,
    }));

    function setOpen(nextOpen: boolean) {
        if (nextOpen === isOpen.value) return;

        if (nextOpen) closeReason.value = null;
        controllableOpen.setValue(nextOpen);
    }

    function open() {
        setOpen(true);
    }

    function close(reason: ToastCloseReason = 'dismiss') {
        if (!isOpen.value) return;

        setOpen(false);
        handleToastClose(reason);
    }

    function toggle() {
        if (isOpen.value) close();
        else open();
    }

    function handleToastClose(reason: ToastCloseReason) {
        closeReason.value = reason;
        options.onClose?.(reason);
    }

    return {
        isOpen,
        lastCloseReason,
        toastProps,
        setOpen,
        open,
        close,
        toggle,
    };
}
