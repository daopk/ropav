import { onBeforeUnmount, ref } from 'vue';

export interface UseDelayedOpenOptions {
    openDelay?: number | (() => number | undefined);
    disabled?: boolean | (() => boolean | undefined);
}

function readOption<T>(value: T | (() => T | undefined) | undefined, fallback: T): T {
    return typeof value === 'function'
        ? (value as () => T | undefined)() ?? fallback
        : value ?? fallback;
}

export function useDelayedOpen(options: UseDelayedOpenOptions = {}) {
    const isOpen = ref(false);
    let openTimer: ReturnType<typeof setTimeout> | null = null;

    function clearTimers() {
        if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    }

    function isDisabled() {
        return readOption(options.disabled, false);
    }

    function open() {
        if (isDisabled()) return;
        const delay = readOption(options.openDelay, 0);
        if (delay <= 0) {
            isOpen.value = true;
            return;
        }
        if (openTimer) clearTimeout(openTimer);
        openTimer = setTimeout(() => { isOpen.value = true; openTimer = null; }, delay);
    }

    function closeImmediate() {
        clearTimers();
        isOpen.value = false;
    }

    onBeforeUnmount(clearTimers);

    return {
        isOpen,
        open,
        closeImmediate,
    };
}
