import { onBeforeUnmount, type Ref } from 'vue';

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
    pointerId: number | undefined;
    rect: DOMRect;
    view: Window | null;
}

function getPointerId(event: PointerEvent) {
    return Number.isFinite(event.pointerId) ? event.pointerId : undefined;
}

export function useColorPickerDrag({
    target,
    focusTarget,
    readonly,
    isGeometryValid,
    updateFromPointer,
}: UseColorPickerDragOptions) {
    let session: ColorPickerDragSession | undefined;
    let frameWindow: Window | null = null;
    let frameId: number | undefined;
    let geometryDirty = false;
    let pendingPointer: ColorPickerPointerCoordinates | undefined;

    function isCurrentPointer(event: PointerEvent) {
        const currentSession = session;
        if (!currentSession) return false;

        const pointerId = getPointerId(event);
        return currentSession.pointerId === undefined || pointerId === currentSession.pointerId;
    }

    function cancelScheduledFrame() {
        if (frameId !== undefined) frameWindow?.cancelAnimationFrame(frameId);
        frameWindow = null;
        frameId = undefined;
    }

    function applyScheduledUpdate(currentSession: ColorPickerDragSession) {
        if (session !== currentSession) return;

        if (geometryDirty) {
            const rect = currentSession.element.getBoundingClientRect();
            if (!isGeometryValid(rect)) return;

            currentSession.rect = rect;
            geometryDirty = false;
        }

        const pointer = pendingPointer;
        pendingPointer = undefined;
        if (pointer) updateFromPointer(pointer, currentSession.rect);
    }

    function flushScheduledUpdate() {
        const currentSession = session;
        cancelScheduledFrame();
        if (currentSession) applyScheduledUpdate(currentSession);
    }

    function scheduleUpdate() {
        const currentSession = session;
        if (!currentSession) return;

        const view = currentSession.view;
        if (!view?.requestAnimationFrame) {
            applyScheduledUpdate(currentSession);
            return;
        }
        if (frameId !== undefined) return;

        frameWindow = view;
        frameId = view.requestAnimationFrame(() => {
            frameWindow = null;
            frameId = undefined;
            applyScheduledUpdate(currentSession);
        });
    }

    function onGeometryChange() {
        if (!session) return;
        geometryDirty = true;
        scheduleUpdate();
    }

    function stopDragging() {
        const stoppedSession = session;
        if (!stoppedSession) return;

        stoppedSession.view?.removeEventListener('pointermove', onPointerMove);
        stoppedSession.view?.removeEventListener('pointerup', onPointerEnd);
        stoppedSession.view?.removeEventListener('pointercancel', onPointerEnd);
        stoppedSession.view?.removeEventListener('resize', onGeometryChange);
        stoppedSession.view?.removeEventListener('scroll', onGeometryChange, true);
        cancelScheduledFrame();
        geometryDirty = false;
        pendingPointer = undefined;
        session = undefined;
    }

    function onPointerMove(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;

        pendingPointer = { clientX: event.clientX, clientY: event.clientY };
        scheduleUpdate();
    }

    function onPointerEnd(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;
        if (event.type === 'pointerup') flushScheduledUpdate();
        stopDragging();
    }

    function onPointerDown(event: PointerEvent) {
        if (readonly() || event.button !== 0 || event.isPrimary === false) return;

        const el = target.value;
        if (!el) return;

        event.preventDefault();
        (focusTarget?.value ?? el).focus();
        stopDragging();

        const nextSession: ColorPickerDragSession = {
            element: el,
            pointerId: getPointerId(event),
            rect: el.getBoundingClientRect(),
            view: el.ownerDocument.defaultView,
        };
        session = nextSession;
        geometryDirty = !isGeometryValid(nextSession.rect);
        if (!geometryDirty) {
            updateFromPointer({ clientX: event.clientX, clientY: event.clientY }, nextSession.rect);
        }
        if (session !== nextSession) return;

        nextSession.view?.addEventListener('pointermove', onPointerMove);
        nextSession.view?.addEventListener('pointerup', onPointerEnd);
        nextSession.view?.addEventListener('pointercancel', onPointerEnd);
        nextSession.view?.addEventListener('resize', onGeometryChange);
        nextSession.view?.addEventListener('scroll', onGeometryChange, true);
    }

    onBeforeUnmount(stopDragging);

    return { onPointerDown };
}
