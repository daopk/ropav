import { onBeforeUnmount, type Ref } from 'vue';
import { createPointerSession } from '@/utils/dom/pointerSession';

export interface ColorPickerPointerCoordinates {
    clientX: number;
    clientY: number;
}

interface UseColorPickerDragOptions {
    target: Ref<HTMLElement | null>;
    focusTarget?: Ref<HTMLElement | null>;
    readonly: () => boolean;
    isGeometryValid: (rect: DOMRect) => boolean;
    updateFromPointer: (pointer: ColorPickerPointerCoordinates, rect: DOMRect) => void;
}

interface ColorPickerDragSession {
    element: HTMLElement;
    geometryValid: boolean;
    rect: DOMRect;
}

export function useColorPickerDrag({
    target,
    focusTarget,
    readonly,
    isGeometryValid,
    updateFromPointer,
}: UseColorPickerDragOptions) {
    function refreshGeometry(currentSession: ColorPickerDragSession) {
        const rect = currentSession.element.getBoundingClientRect();
        if (!isGeometryValid(rect)) return false;

        currentSession.geometryValid = true;
        currentSession.rect = rect;
        return true;
    }

    function applyPointer(event: PointerEvent, currentSession: ColorPickerDragSession) {
        updateFromPointer({ clientX: event.clientX, clientY: event.clientY }, currentSession.rect);
    }

    const pointerSession = createPointerSession<ColorPickerDragSession>({
        onStart(event, currentSession) {
            if (currentSession.geometryValid) applyPointer(event, currentSession);
        },
        onUpdate: applyPointer,
        refreshGeometry,
    });

    function onPointerDown(event: PointerEvent) {
        return pointerSession.start(event, () => {
            if (readonly()) return;

            const element = target.value;
            if (!element) return;

            event.preventDefault();
            (focusTarget?.value ?? element).focus();
            const rect = element.getBoundingClientRect();
            const geometryValid = isGeometryValid(rect);
            return {
                geometryDirty: !geometryValid,
                state: { element, geometryValid, rect },
                target: element,
            };
        });
    }

    onBeforeUnmount(pointerSession.stop);

    return { onPointerDown };
}
