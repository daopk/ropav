import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPointerSession } from './pointerSession';

function pointerEvent(
    type: 'pointercancel' | 'pointerdown' | 'pointermove' | 'pointerup',
    {
        button = 0,
        clientX = 0,
        isPrimary = true,
        pointerId = 1,
    }: {
        button?: number;
        clientX?: number;
        isPrimary?: boolean;
        pointerId?: number;
    } = {},
) {
    const event = new MouseEvent(type, { button, clientX });
    Object.defineProperties(event, {
        isPrimary: { value: isPrimary },
        pointerId: { value: pointerId },
    });
    return event as PointerEvent;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createPointerSession', () => {
    it('owns pointer matching, frame scheduling, final flush, and teardown', () => {
        let queuedFrame: FrameRequestCallback | undefined;
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            queuedFrame = callback;
            return 1;
        });
        const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        const onStart = vi.fn();
        const onStop = vi.fn();
        const onUpdate = vi.fn();
        const target = document.createElement('div');
        const state = { name: 'drag' };
        const session = createPointerSession({ onStart, onStop, onUpdate });
        const initialize = vi.fn(() => ({ state, target }));

        expect(session.start(pointerEvent('pointerdown', { button: 2 }), initialize)).toBe(false);
        expect(session.start(pointerEvent('pointerdown', { isPrimary: false }), initialize)).toBe(
            false,
        );
        expect(initialize).not.toHaveBeenCalled();

        expect(session.start(pointerEvent('pointerdown', { pointerId: 7 }), initialize)).toBe(true);
        expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ pointerId: 7 }), state);

        window.dispatchEvent(pointerEvent('pointermove', { clientX: 20, pointerId: 8 }));
        window.dispatchEvent(pointerEvent('pointerup', { clientX: 20, pointerId: 8 }));
        expect(onUpdate).not.toHaveBeenCalled();
        expect(onStop).not.toHaveBeenCalled();

        window.dispatchEvent(pointerEvent('pointermove', { clientX: 30, pointerId: 7 }));
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 40, pointerId: 7 }));
        expect(window.requestAnimationFrame).toHaveBeenCalledOnce();
        expect(onUpdate).not.toHaveBeenCalled();

        window.dispatchEvent(pointerEvent('pointerup', { clientX: 50, pointerId: 7 }));
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ clientX: 40 }), state);
        expect(onStop).toHaveBeenCalledWith(state);
        expect(cancelFrame).toHaveBeenCalledOnce();

        queuedFrame?.(0);
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 60, pointerId: 7 }));
        expect(onUpdate).toHaveBeenCalledOnce();
    });

    it('refreshes invalidated geometry before applying the latest pointer', () => {
        const queuedFrames: FrameRequestCallback[] = [];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            queuedFrames.push(callback);
            return queuedFrames.length;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        const target = document.createElement('div');
        const state = { geometry: 1 };
        const refreshGeometry = vi.fn(() => false);
        const onUpdate = vi.fn();
        const session = createPointerSession({ onUpdate, refreshGeometry });

        session.start(pointerEvent('pointerdown'), () => ({
            geometryDirty: true,
            state,
            target,
        }));
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 10 }));
        queuedFrames.shift()?.(0);
        expect(refreshGeometry).toHaveBeenCalledOnce();
        expect(onUpdate).not.toHaveBeenCalled();

        refreshGeometry.mockImplementation(() => {
            state.geometry = 2;
            return true;
        });
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 20 }));
        queuedFrames.shift()?.(0);
        expect(refreshGeometry).toHaveBeenCalledTimes(2);
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ clientX: 20 }), state);

        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
        queuedFrames.shift()?.(0);
        expect(refreshGeometry).toHaveBeenCalledTimes(3);
        session.stop();
    });

    it('supports immediate adapters and discards their end event', () => {
        const onStop = vi.fn();
        const onUpdate = vi.fn();
        const session = createPointerSession({
            endUpdate: 'none',
            onStop,
            onUpdate,
            updateMode: 'immediate',
        });
        const state = { axis: 'x' };

        session.start(pointerEvent('pointerdown', { pointerId: 4 }), () => ({
            state,
            target: document.createElement('div'),
        }));
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 30, pointerId: 4 }));
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ clientX: 30 }), state);

        window.dispatchEvent(pointerEvent('pointerup', { clientX: 50, pointerId: 4 }));
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onStop).toHaveBeenCalledWith(state);
    });

    it('can use the matching end event as the final update', () => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        const onUpdate = vi.fn();
        const session = createPointerSession({
            endUpdate: 'event',
            onUpdate,
        });
        const state = { value: 0 };

        session.start(pointerEvent('pointerdown', { pointerId: 5 }), () => ({
            state,
            target: document.createElement('div'),
        }));
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 20, pointerId: 5 }));
        window.dispatchEvent(pointerEvent('pointercancel', { clientX: 40, pointerId: 5 }));

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ clientX: 40, type: 'pointercancel' }),
            state,
        );
    });

    it('discards pending work when the active pointer is canceled', () => {
        let queuedFrame: FrameRequestCallback | undefined;
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            queuedFrame = callback;
            return 1;
        });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        const onStop = vi.fn();
        const onUpdate = vi.fn();
        const session = createPointerSession({ onStop, onUpdate });

        session.start(pointerEvent('pointerdown', { pointerId: 6 }), () => ({
            state: 'drag',
            target: document.createElement('div'),
        }));
        window.dispatchEvent(pointerEvent('pointermove', { clientX: 20, pointerId: 6 }));
        window.dispatchEvent(pointerEvent('pointercancel', { clientX: 30, pointerId: 6 }));
        queuedFrame?.(0);

        expect(onUpdate).not.toHaveBeenCalled();
        expect(onStop).toHaveBeenCalledWith('drag');
    });

    it('falls back to an unscoped session when pointer identifiers are unavailable', () => {
        const onUpdate = vi.fn();
        const session = createPointerSession({
            onUpdate,
            updateMode: 'immediate',
        });
        const state = { name: 'fallback' };

        session.start(pointerEvent('pointerdown', { pointerId: Number.NaN }), () => ({
            state,
            target: document.createElement('div'),
        }));
        window.dispatchEvent(pointerEvent('pointermove', { pointerId: 9 }));
        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ pointerId: 9 }), state);

        session.stop();
    });

    it('stops the active adapter before replacing it and stops idempotently', () => {
        const onStop = vi.fn();
        const session = createPointerSession({ onStop, onUpdate: vi.fn() });
        const first = { name: 'first' };
        const second = { name: 'second' };
        const target = document.createElement('div');

        session.start(pointerEvent('pointerdown'), () => ({ state: first, target }));
        session.start(pointerEvent('pointerdown'), () => ({ state: second, target }));
        expect(onStop).toHaveBeenCalledWith(first);

        session.stop();
        session.stop();
        expect(onStop).toHaveBeenCalledTimes(2);
        expect(onStop).toHaveBeenLastCalledWith(second);
    });
});
