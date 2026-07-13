import { vi } from 'vitest';

export function mockAnimationFrames(view: Window = window) {
    let nextFrameId = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    const request = vi.spyOn(view, 'requestAnimationFrame').mockImplementation((callback) => {
        nextFrameId += 1;
        callbacks.set(nextFrameId, callback);
        return nextFrameId;
    });
    const cancel = vi.spyOn(view, 'cancelAnimationFrame').mockImplementation((frameId) => {
        callbacks.delete(frameId);
    });

    function flushFrame(timestamp = 0) {
        const pendingCallbacks = [...callbacks.values()];
        callbacks.clear();
        for (const callback of pendingCallbacks) callback(timestamp);
    }

    function restore() {
        request.mockRestore();
        cancel.mockRestore();
    }

    return {
        cancel,
        flushFrame,
        pendingCount: () => callbacks.size,
        request,
        restore,
    };
}
