import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';
import { isEventWithinElement } from '@/utils/dom/events';

export function useClickOutside(
    target: Ref<Element | null> | Ref<Element | null>[],
    active: Readonly<Ref<boolean>>,
    callback: (event: MouseEvent) => void,
) {
    const targets = Array.isArray(target) ? target : [target];
    const listeningDocuments = new Set<Document>();
    let stopWatch: (() => void) | undefined;

    function handler(event: MouseEvent) {
        const inside = targets.some((current) => {
            const element = current.value;
            return element ? isEventWithinElement(event, element) : false;
        });
        if (!inside) callback(event);
    }

    function detachListeners() {
        for (const document of listeningDocuments) {
            document.removeEventListener('click', handler, true);
        }
        listeningDocuments.clear();
    }

    function syncListeners() {
        detachListeners();
        if (!active.value) return;

        for (const current of targets) {
            const document = current.value?.ownerDocument;
            if (!document || listeningDocuments.has(document)) continue;
            document.addEventListener('click', handler, true);
            listeningDocuments.add(document);
        }
    }

    onMounted(() => {
        stopWatch = watch([active, ...targets], syncListeners, { immediate: true });
    });

    onBeforeUnmount(() => {
        stopWatch?.();
        detachListeners();
    });
}
