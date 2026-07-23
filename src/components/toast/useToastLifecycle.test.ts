import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type { ToastCloseReason } from './types';
import { useToastLifecycle } from './useToastLifecycle';

interface LifecycleHarnessOptions {
    duration?: number;
    pauseOnHover?: boolean;
    pauseOnFocus?: boolean;
    reopenOnClose?: boolean;
}

function mountLifecycle(options: Readonly<LifecycleHarnessOptions> = {}) {
    const state = reactive({
        open: true,
        duration: options.duration ?? 1000,
        pauseOnHover: options.pauseOnHover ?? true,
        pauseOnFocus: options.pauseOnFocus ?? true,
    });
    const requestedClose = vi.fn();
    let lifecycle!: ReturnType<typeof useToastLifecycle>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                lifecycle = useToastLifecycle({
                    isOpen: () => state.open,
                    duration: () => state.duration,
                    pauseOnHover: () => state.pauseOnHover,
                    pauseOnFocus: () => state.pauseOnFocus,
                    requestClose(reason) {
                        requestedClose(reason);
                        state.open = false;
                        if (options.reopenOnClose) state.open = true;
                    },
                });

                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        state,
        requestedClose,
        get lifecycle() {
            return lifecycle;
        },
    };
}

function createFocusOutEvent(currentTarget: Element, relatedTarget: EventTarget | null) {
    return { currentTarget, relatedTarget } as unknown as FocusEvent;
}

afterEach(() => {
    vi.useRealTimers();
});

describe('useToastLifecycle', () => {
    it('requests a timeout close after the configured duration', () => {
        vi.useFakeTimers();
        const { requestedClose, state } = mountLifecycle({ duration: 1000 });

        vi.advanceTimersByTime(999);
        expect(requestedClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledOnce();
        expect(requestedClose).toHaveBeenCalledWith('timeout' satisfies ToastCloseReason);
        expect(state.open).toBe(false);
    });

    it('pauses on hover and resumes with the remaining duration', () => {
        vi.useFakeTimers();
        const { lifecycle, requestedClose } = mountLifecycle({ duration: 1000 });

        vi.advanceTimersByTime(300);
        lifecycle.rootEvents.onMouseenter();
        vi.advanceTimersByTime(2000);
        expect(requestedClose).not.toHaveBeenCalled();

        lifecycle.rootEvents.onMouseleave();
        vi.advanceTimersByTime(699);
        expect(requestedClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledWith('timeout');
    });

    it('keeps focus pauses within the root and resumes after focus leaves', () => {
        vi.useFakeTimers();
        const { lifecycle, requestedClose } = mountLifecycle({ duration: 1000 });
        const root = document.createElement('div');
        const child = document.createElement('button');
        root.append(child);

        vi.advanceTimersByTime(250);
        lifecycle.rootEvents.onFocusin();
        lifecycle.rootEvents.onFocusout(createFocusOutEvent(root, child));
        vi.advanceTimersByTime(2000);
        expect(requestedClose).not.toHaveBeenCalled();

        lifecycle.rootEvents.onFocusout(createFocusOutEvent(root, document.body));
        vi.advanceTimersByTime(749);
        expect(requestedClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledWith('timeout');
    });

    it('uses a fresh duration when duration changes while paused', async () => {
        vi.useFakeTimers();
        const { lifecycle, requestedClose, state } = mountLifecycle({ duration: 1000 });

        vi.advanceTimersByTime(400);
        lifecycle.rootEvents.onMouseenter();
        state.duration = 2000;
        await nextTick();

        vi.advanceTimersByTime(3000);
        expect(requestedClose).not.toHaveBeenCalled();

        lifecycle.rootEvents.onMouseleave();
        vi.advanceTimersByTime(1999);
        expect(requestedClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledWith('timeout');
    });

    it('resumes when a pause option is disabled during the interaction', async () => {
        vi.useFakeTimers();
        const { lifecycle, requestedClose, state } = mountLifecycle({ duration: 1000 });

        vi.advanceTimersByTime(300);
        lifecycle.rootEvents.onMouseenter();
        state.pauseOnHover = false;
        await nextTick();

        vi.advanceTimersByTime(699);
        expect(requestedClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledWith('timeout');
    });

    it('starts a fresh close cycle after a controlled owner reopens synchronously', async () => {
        vi.useFakeTimers();
        const { requestedClose, state } = mountLifecycle({
            duration: 1000,
            reopenOnClose: true,
        });

        vi.advanceTimersByTime(1000);
        await nextTick();
        expect(requestedClose).toHaveBeenCalledTimes(1);
        expect(state.open).toBe(true);

        vi.advanceTimersByTime(999);
        expect(requestedClose).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        expect(requestedClose).toHaveBeenCalledTimes(2);
    });

    it('clears the active timer when its owner unmounts', () => {
        vi.useFakeTimers();
        const { requestedClose, unmount } = mountLifecycle({ duration: 1000 });

        unmount();
        vi.advanceTimersByTime(1000);

        expect(requestedClose).not.toHaveBeenCalled();
    });
});
