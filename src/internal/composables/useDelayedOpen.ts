import { computed, onBeforeUnmount, ref } from 'vue';

export interface UseDelayedOpenOptions {
    open?: boolean | (() => boolean | undefined);
    openDelay?: number | (() => number | undefined);
    disabled?: boolean | (() => boolean | undefined);
    onOpenChange?: (open: boolean) => void;
}

function readOption<T>(value: T | (() => T | undefined) | undefined, fallback: T): T {
    return typeof value === 'function'
        ? ((value as () => T | undefined)() ?? fallback)
        : (value ?? fallback);
}

function readOptional<T>(value: T | (() => T | undefined) | undefined): T | undefined {
    return typeof value === 'function' ? (value as () => T | undefined)() : value;
}

export function useDelayedOpen(options: UseDelayedOpenOptions = {}) {
    const uncontrolledOpen = ref(false);
    let openTimer: ReturnType<typeof setTimeout> | null = null;

    const isOpen = computed(() => readOptional(options.open) ?? uncontrolledOpen.value);

    function clearTimers() {
        if (openTimer) {
            clearTimeout(openTimer);
            openTimer = null;
        }
    }

    function isDisabled() {
        return readOption(options.disabled, false);
    }

    function setOpen(nextOpen: boolean) {
        const previousOpen = isOpen.value;
        if (readOptional(options.open) === undefined) uncontrolledOpen.value = nextOpen;
        if (previousOpen !== nextOpen) options.onOpenChange?.(nextOpen);
    }

    function open() {
        if (isDisabled()) return;
        const delay = readOption(options.openDelay, 0);
        if (delay <= 0) {
            setOpen(true);
            return;
        }
        if (openTimer) clearTimeout(openTimer);
        openTimer = setTimeout(() => {
            setOpen(true);
            openTimer = null;
        }, delay);
    }

    function closeImmediate() {
        clearTimers();
        setOpen(false);
    }

    onBeforeUnmount(clearTimers);

    return {
        isOpen,
        open,
        closeImmediate,
    };
}
