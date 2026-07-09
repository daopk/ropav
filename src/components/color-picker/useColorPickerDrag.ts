import { onBeforeUnmount, type Ref } from 'vue';

interface UseColorPickerDragOptions {
    target: Ref<HTMLElement | null>;
    readonly: () => boolean;
    updateFromPointer: (event: PointerEvent, target: HTMLElement) => void;
}

export function useColorPickerDrag({
    target,
    readonly,
    updateFromPointer,
}: UseColorPickerDragOptions) {
    let dragWindow: Window | null = null;

    function stopDragging() {
        if (!dragWindow) return;

        dragWindow.removeEventListener('pointermove', onPointerMove);
        dragWindow.removeEventListener('pointerup', stopDragging);
        dragWindow.removeEventListener('pointercancel', stopDragging);
        dragWindow = null;
    }

    function onPointerMove(event: PointerEvent) {
        const el = target.value;
        if (!el) {
            stopDragging();
            return;
        }

        updateFromPointer(event, el);
    }

    function onPointerDown(event: PointerEvent) {
        if (readonly()) return;

        const el = target.value;
        if (!el) return;

        event.preventDefault();
        el.focus();
        updateFromPointer(event, el);

        stopDragging();

        dragWindow = el.ownerDocument.defaultView;
        dragWindow?.addEventListener('pointermove', onPointerMove);
        dragWindow?.addEventListener('pointerup', stopDragging);
        dragWindow?.addEventListener('pointercancel', stopDragging);
    }

    onBeforeUnmount(stopDragging);

    return { onPointerDown };
}
