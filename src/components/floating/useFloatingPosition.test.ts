import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, reactive, ref, shallowReactive, shallowRef } from 'vue';
import { flush, mountDom } from '../../../tests/utils/vue';
import type {
    FloatingPlacement,
    FloatingReference,
    FloatingStrategy,
    FloatingTarget,
} from './types';
import {
    readFloatingTarget,
    resolveFloatingTarget,
    useFloatingPosition,
    useFloatingTarget,
} from './useFloatingPosition';

const floatingMocks = vi.hoisted(() => {
    const cleanup = vi.fn();
    return {
        cleanup,
        computePosition: vi.fn(),
        autoUpdate: vi.fn(
            (_reference: unknown, _floating: unknown, update: () => void | Promise<void>) => {
                void update();
                return cleanup;
            },
        ),
        offset: vi.fn((options: unknown) => ({ name: 'offset', options, fn: vi.fn() })),
        flip: vi.fn((options: unknown) => ({ name: 'flip', options, fn: vi.fn() })),
        shift: vi.fn((options: unknown) => ({ name: 'shift', options, fn: vi.fn() })),
        arrow: vi.fn((options: unknown) => ({ name: 'arrow', options, fn: vi.fn() })),
    };
});

vi.mock('@floating-ui/dom', () => ({
    arrow: floatingMocks.arrow,
    autoUpdate: floatingMocks.autoUpdate,
    computePosition: floatingMocks.computePosition,
    flip: floatingMocks.flip,
    offset: floatingMocks.offset,
    shift: floatingMocks.shift,
}));

function createVirtualReference(x: number, y: number): FloatingReference {
    return {
        getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
    };
}

describe('floating positioning', () => {
    beforeEach(() => {
        for (const mock of Object.values(floatingMocks)) mock.mockClear();
        floatingMocks.computePosition.mockResolvedValue({
            x: 12,
            y: 34,
            placement: 'left',
            strategy: 'fixed',
            middlewareData: { arrow: { x: 5, y: 6 } },
        });
    });

    it('resolves selector, element, virtual element, and ref targets reactively', async () => {
        const first = document.createElement('button');
        first.id = 'floating-first';
        const second = document.createElement('button');
        document.body.append(first, second);

        const virtual = createVirtualReference(20, 30);
        const innerTarget = shallowRef<FloatingReference | null>(first);
        const target = shallowReactive<{ value: FloatingTarget | null }>({
            value: '#floating-first',
        });
        let floatingTarget!: ReturnType<typeof useFloatingTarget>;

        mountDom(
            defineComponent({
                setup() {
                    const fallback = ref<HTMLElement | null>(null);
                    floatingTarget = useFloatingTarget(() => target.value, fallback);
                    return () => h('span', { ref: fallback });
                },
            }),
        );

        await flush();
        expect(floatingTarget.reference.value).toBe(first);
        expect(resolveFloatingTarget('#floating-first')).toBe(first);
        expect(resolveFloatingTarget(first)).toBe(first);
        expect(resolveFloatingTarget(virtual)).toBe(virtual);
        expect(resolveFloatingTarget('[')).toBeNull();

        target.value = second;
        await flush();
        expect(floatingTarget.reference.value).toBe(second);

        target.value = virtual;
        await flush();
        expect(floatingTarget.reference.value).toBe(virtual);

        target.value = innerTarget;
        await flush();
        expect(readFloatingTarget(target.value)).toBe(first);
        expect(floatingTarget.reference.value).toBe(first);

        innerTarget.value = second;
        await flush();
        expect(floatingTarget.reference.value).toBe(second);

        target.value = null;
        await flush();
        expect(floatingTarget.reference.value).toBeInstanceOf(HTMLElement);
    });

    it('applies public defaults and positions without an explicit open option', async () => {
        const reference = createVirtualReference(10, 20);
        let floating!: ReturnType<typeof useFloatingPosition>;

        mountDom(
            defineComponent({
                setup() {
                    const content = ref<HTMLElement | null>(null);
                    floating = useFloatingPosition({ reference, floating: content });
                    return () => h('div', { ref: content });
                },
            }),
        );

        await vi.waitFor(() => expect(floating.isPositioned.value).toBe(true));

        const computeOptions = floatingMocks.computePosition.mock.lastCall?.[2];
        expect(computeOptions).toMatchObject({ placement: 'bottom', strategy: 'absolute' });
        expect(computeOptions.middleware.map((item: { name: string }) => item.name)).toEqual([
            'offset',
            'flip',
            'shift',
        ]);
        expect(floatingMocks.offset).toHaveBeenLastCalledWith(8);
        expect(floatingMocks.flip).toHaveBeenLastCalledWith({ padding: 8 });
        expect(floatingMocks.shift).toHaveBeenLastCalledWith({ padding: 8 });
    });

    it('uses ordered middleware, final placement, arrow data, and auto-update lifecycle', async () => {
        const state = reactive({
            open: true,
            placement: 'top' as FloatingPlacement,
            strategy: 'fixed' as FloatingStrategy,
            offset: { mainAxis: 10, crossAxis: 2 },
            flip: true,
            shift: true,
            collisionPadding: { top: 4, right: 6, bottom: 8, left: 10 },
            arrow: true,
            restartKey: 0,
        });
        const reference = shallowRef<FloatingReference | null>(createVirtualReference(10, 20));
        let floating!: ReturnType<typeof useFloatingPosition>;

        mountDom(
            defineComponent({
                setup() {
                    const content = ref<HTMLElement | null>(null);
                    const arrow = ref<HTMLElement | null>(null);
                    const open = computed(() => state.open);
                    floating = useFloatingPosition({
                        reference,
                        floating: content,
                        arrow,
                        open,
                        placement: () => state.placement,
                        strategy: () => state.strategy,
                        offset: () => state.offset,
                        flip: () => state.flip,
                        shift: () => state.shift,
                        collisionPadding: () => state.collisionPadding,
                        restartKey: () => state.restartKey,
                    });
                    return () =>
                        h('div', { ref: content }, state.arrow ? [h('span', { ref: arrow })] : []);
                },
            }),
        );

        await vi.waitFor(() => expect(floating.isPositioned.value).toBe(true));

        const computeOptions = floatingMocks.computePosition.mock.lastCall?.[2];
        expect(computeOptions).toMatchObject({ placement: 'top', strategy: 'fixed' });
        expect(computeOptions.middleware.map((item: { name: string }) => item.name)).toEqual([
            'offset',
            'flip',
            'shift',
            'arrow',
        ]);
        expect(floatingMocks.offset).toHaveBeenLastCalledWith(state.offset);
        expect(floatingMocks.flip).toHaveBeenLastCalledWith({
            padding: state.collisionPadding,
        });
        expect(floatingMocks.shift).toHaveBeenLastCalledWith({
            padding: state.collisionPadding,
        });
        expect(floating.actualPlacement.value).toBe('left');
        expect(floating.floatingStyle.value).toEqual({
            position: 'fixed',
            top: '34px',
            left: '12px',
        });
        expect(floating.arrowStyle.value).toEqual({ left: '5px', top: '6px' });

        const autoUpdateCalls = floatingMocks.autoUpdate.mock.calls.length;
        reference.value = createVirtualReference(40, 50);
        await vi.waitFor(() => {
            expect(floatingMocks.autoUpdate.mock.calls.length).toBeGreaterThan(autoUpdateCalls);
        });
        expect(floatingMocks.cleanup).toHaveBeenCalled();

        const restartedAutoUpdateCalls = floatingMocks.autoUpdate.mock.calls.length;
        state.restartKey += 1;
        await vi.waitFor(() => {
            expect(floatingMocks.autoUpdate.mock.calls.length).toBeGreaterThan(
                restartedAutoUpdateCalls,
            );
        });

        state.flip = false;
        state.shift = false;
        state.arrow = false;
        await vi.waitFor(() => {
            const options = floatingMocks.computePosition.mock.lastCall?.[2];
            expect(options.middleware.map((item: { name: string }) => item.name)).toEqual([
                'offset',
            ]);
        });

        const cleanupCalls = floatingMocks.cleanup.mock.calls.length;
        const autoUpdateCallsBeforeClose = floatingMocks.autoUpdate.mock.calls.length;

        state.open = false;
        await flush();
        expect(floating.isPositioned.value).toBe(true);
        expect(floating.actualPlacement.value).toBe('left');
        expect(floating.floatingStyle.value).toEqual({
            position: 'fixed',
            top: '34px',
            left: '12px',
        });
        expect(floatingMocks.cleanup).toHaveBeenCalledTimes(cleanupCalls + 1);
        expect(floatingMocks.autoUpdate).toHaveBeenCalledTimes(autoUpdateCallsBeforeClose);
    });
});
