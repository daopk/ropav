import { watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useClickOutside(
    target: Ref<HTMLElement | null>,
    active: Ref<boolean>,
    callback: () => void,
) {
    function handler(e: MouseEvent) {
        if (target.value && !target.value.contains(e.target as Node)) {
            callback();
        }
    }

    watch(active, (val) => {
        if (val) {
            document.addEventListener('click', handler, true);
        } else {
            document.removeEventListener('click', handler, true);
        }
    });

    onMounted(() => {
        if (active.value) {
            document.addEventListener('click', handler, true);
        }
    });

    onBeforeUnmount(() => {
        document.removeEventListener('click', handler, true);
    });
}
