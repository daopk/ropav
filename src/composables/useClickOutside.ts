import { watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useClickOutside(
    target: Ref<Element | null> | Ref<Element | null>[],
    active: Readonly<Ref<boolean>>,
    callback: (event: MouseEvent) => void,
) {
    let isListening = false;
    let stopWatch: (() => void) | undefined;

    function handler(e: MouseEvent) {
        const targets = Array.isArray(target) ? target : [target];
        const isInside = targets.some((current) => current.value?.contains(e.target as Node));
        if (!isInside) callback(e);
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
