import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, mountDom, mountDomWithApp } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

function mockTrackRect(track: HTMLElement, rect: Partial<DOMRect> = {}) {
    return vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
        bottom: 20,
        height: 20,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
        ...rect,
    });
}

async function flushPointerUpdates() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    await flush();
}

function dispatchPointer(
    target: EventTarget,
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    clientX: number,
    clientY = 10,
    { isPrimary = true, pointerId = 1 }: { isPrimary?: boolean; pointerId?: number } = {},
) {
    const init = {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX,
        clientY,
        isPrimary,
        pointerId,
    };
    const event =
        typeof window.PointerEvent === 'function'
            ? new PointerEvent(type, init)
            : new MouseEvent(type, init);
    if (!('pointerId' in event)) {
        Object.defineProperties(event, {
            isPrimary: { value: isPrimary },
            pointerId: { value: pointerId },
        });
    }
    target.dispatchEvent(event);
}

describe('RangeSlider pointer interaction', () => {
    it('keeps a controlled drag anchored while the lower thumb crosses and crosses back', async () => {
        const value = ref<[number, number]>([20, 80]);
        const onUpdate = vi.fn((nextValue: [number, number]) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: value.value,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const lowerThumb = container.querySelector('.rp-range-slider__thumb--lower')!;
        const [lowerInput, upperInput] = [...container.querySelectorAll<HTMLInputElement>('input')];
        const tooltips = [...container.querySelectorAll<HTMLElement>('.rp-range-slider__tooltip')];
        mockTrackRect(track);

        dispatchPointer(lowerThumb, 'pointerdown', 20, 10, { pointerId: 11 });
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([20, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lowerInput);

        dispatchPointer(window, 'pointermove', 90, 10, { pointerId: 11 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([80, 90]);
        expect(value.value).toEqual([80, 90]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upperInput);

        dispatchPointer(window, 'pointermove', 95, 10, { pointerId: 11 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([80, 95]);
        expect(value.value).toEqual([80, 95]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');

        dispatchPointer(window, 'pointermove', 70, 10, { pointerId: 11 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([70, 80]);
        expect(value.value).toEqual([70, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lowerInput);

        lowerInput.blur();
        await flush();
        expect(tooltips.every((tooltip) => tooltip.classList.contains('rp-tooltip--open'))).toBe(
            true,
        );

        dispatchPointer(window, 'pointerup', 70, 10, { pointerId: 11 });
        await flush();
        expect(tooltips.every((tooltip) => !tooltip.classList.contains('rp-tooltip--open'))).toBe(
            true,
        );
    });

    it('keeps a positive minimum range blocked at the other thumb', async () => {
        const value = ref<[number, number]>([20, 80]);
        const onUpdate = vi.fn((nextValue: [number, number]) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: value.value,
                        minRange: 10,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const lowerThumb = container.querySelector('.rp-range-slider__thumb--lower')!;
        const [lowerInput, upperInput] = [...container.querySelectorAll<HTMLInputElement>('input')];
        mockTrackRect(track);

        expect(lowerInput.max).toBe('70');
        expect(upperInput.min).toBe('30');

        dispatchPointer(lowerThumb, 'pointerdown', 20, 10, { pointerId: 12 });
        dispatchPointer(window, 'pointermove', 100, 10, { pointerId: 12 });
        await flushPointerUpdates();

        expect(onUpdate).toHaveBeenLastCalledWith([70, 80]);
        expect(value.value).toEqual([70, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lowerInput);
        expect(lowerInput.max).toBe('70');
        expect(upperInput.min).toBe('80');

        dispatchPointer(window, 'pointerup', 100, 10, { pointerId: 12 });
    });

    it('switches thumb roles when a vertical drag crosses the stationary endpoint', async () => {
        const value = ref<[number, number]>([20, 80]);
        const onUpdate = vi.fn((nextValue: [number, number]) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: value.value,
                        orientation: 'vertical',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const lowerThumb = container.querySelector('.rp-range-slider__thumb--lower')!;
        const [lowerInput, upperInput] = [...container.querySelectorAll<HTMLInputElement>('input')];
        mockTrackRect(track, {
            bottom: 300,
            height: 200,
            left: 0,
            right: 20,
            top: 100,
            width: 20,
        });

        dispatchPointer(lowerThumb, 'pointerdown', 10, 260, { pointerId: 13 });
        dispatchPointer(window, 'pointermove', 10, 120, { pointerId: 13 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([80, 90]);
        expect(value.value).toEqual([80, 90]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upperInput);

        dispatchPointer(window, 'pointermove', 10, 180, { pointerId: 13 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([60, 80]);
        expect(value.value).toEqual([60, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lowerInput);

        dispatchPointer(window, 'pointerup', 10, 180, { pointerId: 13 });
    });

    it('chooses the nearest thumb on the track and keeps that thumb for the drag', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        minRange: 10,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const inputs = [...container.querySelectorAll<HTMLInputElement>('input')];
        mockTrackRect(track);

        dispatchPointer(track, 'pointerdown', 30);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([30, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(inputs[0]);

        dispatchPointer(window, 'pointermove', 65);
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([65, 80]);

        dispatchPointer(window, 'pointerup', 65);
        const callCount = onUpdate.mock.calls.length;
        dispatchPointer(window, 'pointermove', 10);
        await flush();
        expect(onUpdate).toHaveBeenCalledTimes(callCount);
    });

    it('caches drag geometry and refreshes it only when the viewport changes', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: false,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const getTrackRect = mockTrackRect(track);

        dispatchPointer(track, 'pointerdown', 30, 10, { pointerId: 31 });
        expect(getTrackRect).toHaveBeenCalledTimes(1);

        dispatchPointer(window, 'pointermove', 40, 10, { pointerId: 31 });
        dispatchPointer(window, 'pointermove', 50, 10, { pointerId: 31 });
        await flushPointerUpdates();
        expect(getTrackRect).toHaveBeenCalledTimes(1);

        window.dispatchEvent(new Event('resize'));
        await flushPointerUpdates();
        expect(getTrackRect).toHaveBeenCalledTimes(2);

        getTrackRect.mockReturnValue({
            bottom: 20,
            height: 20,
            left: 100,
            right: 300,
            top: 0,
            width: 200,
            x: 100,
            y: 0,
            toJSON: () => ({}),
        });
        track.dispatchEvent(new Event('scroll'));
        await flushPointerUpdates();
        expect(getTrackRect).toHaveBeenCalledTimes(3);

        onUpdate.mockClear();
        dispatchPointer(window, 'pointermove', 200, 10, { pointerId: 31 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([50, 80]);
        expect(getTrackRect).toHaveBeenCalledTimes(3);

        dispatchPointer(window, 'pointerup', 200, 10, { pointerId: 31 });
    });

    it('coalesces pointer moves per frame and flushes the latest move on pointerup', async () => {
        let queuedFrame: FrameRequestCallback | undefined;
        let nextFrameId = 0;
        const requestFrame = vi
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((callback) => {
                queuedFrame = callback;
                nextFrameId += 1;
                return nextFrameId;
            });
        const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        tooltip: false,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        mockTrackRect(track);
        dispatchPointer(track, 'pointerdown', 30, 10, { pointerId: 32 });
        onUpdate.mockClear();

        dispatchPointer(window, 'pointermove', 40, 10, { pointerId: 32 });
        dispatchPointer(window, 'pointermove', 50, 10, { pointerId: 32 });
        dispatchPointer(window, 'pointermove', 60, 10, { pointerId: 32 });

        expect(requestFrame).toHaveBeenCalledTimes(1);
        expect(onUpdate).not.toHaveBeenCalled();

        const firstFrame = queuedFrame;
        queuedFrame = undefined;
        firstFrame?.(0);
        await flush();
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenLastCalledWith([60, 80]);

        dispatchPointer(window, 'pointermove', 65, 10, { pointerId: 32 });
        dispatchPointer(window, 'pointermove', 70, 10, { pointerId: 32 });
        dispatchPointer(window, 'pointerup', 70, 10, { pointerId: 32 });
        await flush();

        expect(onUpdate).toHaveBeenCalledTimes(2);
        expect(onUpdate).toHaveBeenLastCalledWith([70, 80]);
        expect(cancelFrame).toHaveBeenCalled();

        requestFrame.mockRestore();
        cancelFrame.mockRestore();
    });

    it('uses an explicitly targeted visual thumb even when the other thumb is nearer', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const upperThumb = container.querySelector('.rp-range-slider__thumb--upper')!;
        const upperInput = container.querySelector('.rp-range-slider__native--upper')!;
        mockTrackRect(track);

        dispatchPointer(upperThumb, 'pointerdown', 25);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith([20, 25]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upperInput);
    });

    it('splits a collapsed range by side and reuses the active thumb for an exact tie', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [50, 50],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const [lower, upper] = [...container.querySelectorAll<HTMLInputElement>('input')];
        mockTrackRect(track);

        dispatchPointer(track, 'pointerdown', 50);
        await flush();
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upper);
        dispatchPointer(window, 'pointerup', 50);

        dispatchPointer(track, 'pointerdown', 40);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([40, 50]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lower);
        dispatchPointer(window, 'pointerup', 40);

        dispatchPointer(track, 'pointerdown', 50);
        await flush();
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lower);
        dispatchPointer(window, 'pointerup', 50);

        dispatchPointer(track, 'pointerdown', 60);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([50, 60]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upper);
    });

    it('maps vertical pointer positions from bottom to top', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        orientation: 'vertical',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        mockTrackRect(track, {
            bottom: 300,
            height: 200,
            left: 0,
            right: 20,
            top: 100,
            width: 20,
        });

        dispatchPointer(track, 'pointerdown', 10, 240);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([30, 80]);
        dispatchPointer(window, 'pointerup', 10, 240);

        dispatchPointer(track, 'pointerdown', 10, 140);
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([20, 80]);
    });

    it('ignores a secondary pointer without letting it move or end the active drag', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        mockTrackRect(track);

        dispatchPointer(track, 'pointerdown', 30, 10, { pointerId: 7 });
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([30, 80]);

        const callsAfterPointerDown = onUpdate.mock.calls.length;
        dispatchPointer(window, 'pointermove', 60, 10, {
            isPrimary: false,
            pointerId: 8,
        });
        dispatchPointer(window, 'pointerup', 60, 10, {
            isPrimary: false,
            pointerId: 8,
        });
        await flush();
        expect(onUpdate).toHaveBeenCalledTimes(callsAfterPointerDown);

        dispatchPointer(window, 'pointermove', 50, 10, { pointerId: 7 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith([50, 80]);

        dispatchPointer(window, 'pointerup', 50, 10, { pointerId: 7 });
        const callsAfterPointerUp = onUpdate.mock.calls.length;
        dispatchPointer(window, 'pointermove', 40, 10, { pointerId: 7 });
        await flush();
        expect(onUpdate).toHaveBeenCalledTimes(callsAfterPointerUp);
    });

    it('keeps both tooltips open until a pointer drag ends', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, { modelValue: [20, 80] });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        const lowerInput = container.querySelector<HTMLInputElement>(
            '.rp-range-slider__native--lower',
        )!;
        const tooltips = [...container.querySelectorAll<HTMLElement>('.rp-range-slider__tooltip')];
        mockTrackRect(track);

        dispatchPointer(track, 'pointerdown', 30, 10, { pointerId: 9 });
        await flush();
        expect(tooltips.every((tooltip) => tooltip.classList.contains('rp-tooltip--open'))).toBe(
            true,
        );

        lowerInput.blur();
        dispatchPointer(window, 'pointermove', 40, 10, { pointerId: 9 });
        await flushPointerUpdates();
        expect(tooltips.every((tooltip) => tooltip.classList.contains('rp-tooltip--open'))).toBe(
            true,
        );

        dispatchPointer(window, 'pointerup', 40, 10, { pointerId: 9 });
        await flush();
        expect(tooltips.every((tooltip) => !tooltip.classList.contains('rp-tooltip--open'))).toBe(
            true,
        );
    });

    it('ignores track pointer interaction when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        disabled: true,
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        mockTrackRect(track);
        dispatchPointer(track, 'pointerdown', 40);
        dispatchPointer(window, 'pointermove', 60);
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('removes an active pointer session when unmounted', async () => {
        const onUpdate = vi.fn();
        const removeEventListener = vi.spyOn(window, 'removeEventListener');
        const { container, unmount } = mountDomWithApp(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const track = container.querySelector('.rp-range-slider__track') as HTMLElement;
        mockTrackRect(track);
        dispatchPointer(track, 'pointerdown', 30, 10, { pointerId: 21 });
        const updatesBeforeUnmount = onUpdate.mock.calls.length;

        unmount();

        expect(removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));

        dispatchPointer(window, 'pointermove', 60, 10, { pointerId: 21 });
        expect(onUpdate).toHaveBeenCalledTimes(updatesBeforeUnmount);
    });
});
