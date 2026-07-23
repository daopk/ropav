import { describe, expect, it, vi } from 'vitest';
import { createRafScheduler } from './rafScheduler';

describe('createRafScheduler', () => {
    it('coalesces work into one animation frame', () => {
        const callbacks: FrameRequestCallback[] = [];
        const view = {
            requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
                callbacks.push(callback);
                return callbacks.length;
            }),
            cancelAnimationFrame: vi.fn(),
        } as unknown as Window;
        const callback = vi.fn();
        const scheduler = createRafScheduler(callback, () => view);

        scheduler.schedule();
        scheduler.schedule();
        expect(view.requestAnimationFrame).toHaveBeenCalledTimes(1);

        callbacks[0]?.(0);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('cancels pending work and runs synchronously without a view', () => {
        const callback = vi.fn();
        const view = {
            requestAnimationFrame: vi.fn(() => 7),
            cancelAnimationFrame: vi.fn(),
        } as unknown as Window;
        let currentView: Window | null = view;
        const scheduler = createRafScheduler(callback, () => currentView);

        scheduler.schedule();
        scheduler.cancel();
        expect(view.cancelAnimationFrame).toHaveBeenCalledWith(7);

        currentView = null;
        scheduler.schedule();
        expect(callback).toHaveBeenCalledTimes(1);
    });
});
