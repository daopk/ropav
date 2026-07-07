import { watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useClickOutside(
    target: Ref<HTMLElement | null>,
    active: Readonly<Ref<boolean>>,
    callback: () => void,
) {
    let isListening = false;
    let stopWatch: (() => void) | undefined;

    function handler(e: MouseEvent) {
        if (target.value && !target.value.contains(e.target as Node)) {
            callback();
        }
    }

    function setListening(value: boolean) {
        if (typeof document === 'undefined' || value === isListening) return;
        isListening = value;

        if (value) {
            document.addEventListener('click', handler, true);
        } else {
            document.removeEventListener('click', handler, true);
        }
    }

    onMounted(() => {
        stopWatch = watch(active, setListening, { immediate: true });
    });

    onBeforeUnmount(() => {
        stopWatch?.();
        setListening(false);
    });
}
