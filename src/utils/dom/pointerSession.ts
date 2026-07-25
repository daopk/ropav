import { createRafScheduler } from '../rafScheduler';

type PointerSessionEndUpdate = 'event' | 'none' | 'pending-pointerup';
type PointerSessionUpdateMode = 'animation-frame' | 'immediate';

interface PointerSessionAdapter<TState> {
    endUpdate?: PointerSessionEndUpdate;
    onStart?: (event: PointerEvent, state: TState) => void;
    onStop?: (state: TState) => void;
    onUpdate: (event: PointerEvent, state: TState) => void;
    refreshGeometry?: (state: TState) => boolean;
    updateMode?: PointerSessionUpdateMode;
}

interface PointerSessionStart<TState> {
    geometryDirty?: boolean;
    state: TState;
    target: HTMLElement;
}

interface ActivePointerSession<TState> {
    pointerId: number | undefined;
    state: TState;
    view: Window | null;
}

function getPointerId(event: Pick<PointerEvent, 'pointerId'>) {
    return Number.isFinite(event.pointerId) ? event.pointerId : undefined;
}

function isMatchingPointer(event: Pick<PointerEvent, 'pointerId'>, pointerId: number | undefined) {
    return pointerId === undefined || getPointerId(event) === pointerId;
}

export function createPointerSession<TState>(adapter: PointerSessionAdapter<TState>) {
    let session: ActivePointerSession<TState> | undefined;
    let pendingPointerEvent: PointerEvent | undefined;
    let geometryDirty = false;

    function refreshGeometry(currentSession: ActivePointerSession<TState>) {
        if (!geometryDirty) return true;
        if (!adapter.refreshGeometry) {
            geometryDirty = false;
            return true;
        }
        if (!adapter.refreshGeometry(currentSession.state)) return false;

        geometryDirty = false;
        return session === currentSession;
    }

    function applyScheduledUpdate() {
        const currentSession = session;
        if (!currentSession || !refreshGeometry(currentSession)) return;

        const event = pendingPointerEvent;
        pendingPointerEvent = undefined;
        if (event) adapter.onUpdate(event, currentSession.state);
    }

    const updateScheduler = createRafScheduler(applyScheduledUpdate, () => session?.view);

    function cancelPendingUpdate() {
        updateScheduler.cancel();
        pendingPointerEvent = undefined;
    }

    function flushPendingUpdate() {
        updateScheduler.cancel();
        applyScheduledUpdate();
    }

    function scheduleUpdate() {
        if (session) updateScheduler.schedule();
    }

    function onGeometryChange() {
        if (!session) return;

        geometryDirty = true;
        scheduleUpdate();
    }

    function removeListeners(currentSession: ActivePointerSession<TState>) {
        currentSession.view?.removeEventListener('pointermove', onPointerMove);
        currentSession.view?.removeEventListener('pointerup', onPointerEnd);
        currentSession.view?.removeEventListener('pointercancel', onPointerEnd);
        if (adapter.refreshGeometry) {
            currentSession.view?.removeEventListener('resize', onGeometryChange);
            currentSession.view?.removeEventListener('scroll', onGeometryChange, true);
        }
    }

    function stop() {
        const stoppedSession = session;
        if (!stoppedSession) return;

        removeListeners(stoppedSession);
        cancelPendingUpdate();
        geometryDirty = false;
        session = undefined;
        adapter.onStop?.(stoppedSession.state);
    }

    function addListeners(currentSession: ActivePointerSession<TState>) {
        currentSession.view?.addEventListener('pointermove', onPointerMove);
        currentSession.view?.addEventListener('pointerup', onPointerEnd);
        currentSession.view?.addEventListener('pointercancel', onPointerEnd);
        if (adapter.refreshGeometry) {
            currentSession.view?.addEventListener('resize', onGeometryChange);
            currentSession.view?.addEventListener('scroll', onGeometryChange, true);
        }
    }

    function updateImmediately(event: PointerEvent, currentSession: ActivePointerSession<TState>) {
        if (refreshGeometry(currentSession)) adapter.onUpdate(event, currentSession.state);
    }

    function onPointerMove(event: PointerEvent) {
        const currentSession = session;
        if (!currentSession || !isMatchingPointer(event, currentSession.pointerId)) return;

        if (adapter.updateMode === 'immediate') {
            updateImmediately(event, currentSession);
            return;
        }

        pendingPointerEvent = event;
        scheduleUpdate();
    }

    function applyEndUpdate(event: PointerEvent, currentSession: ActivePointerSession<TState>) {
        switch (adapter.endUpdate ?? 'pending-pointerup') {
            case 'event':
                cancelPendingUpdate();
                updateImmediately(event, currentSession);
                break;
            case 'none':
                cancelPendingUpdate();
                break;
            case 'pending-pointerup':
                if (event.type === 'pointerup') flushPendingUpdate();
                else cancelPendingUpdate();
                break;
        }
    }

    function onPointerEnd(event: PointerEvent) {
        const currentSession = session;
        if (!currentSession || !isMatchingPointer(event, currentSession.pointerId)) return;

        applyEndUpdate(event, currentSession);
        stop();
    }

    function start(event: PointerEvent, initialize: () => PointerSessionStart<TState> | undefined) {
        if (event.button !== 0 || event.isPrimary === false) return false;

        const next = initialize();
        if (!next) return false;

        stop();
        const nextSession: ActivePointerSession<TState> = {
            pointerId: getPointerId(event),
            state: next.state,
            view: next.target.ownerDocument.defaultView,
        };
        session = nextSession;
        geometryDirty = next.geometryDirty ?? false;
        adapter.onStart?.(event, next.state);
        if (session === nextSession) addListeners(nextSession);
        return true;
    }

    return { start, stop };
}
