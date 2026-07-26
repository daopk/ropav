import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

function mockRect(element: Element, rect: Partial<DOMRect> = {}) {
    return vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
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

function dispatchPointer(
    target: EventTarget,
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    clientX: number,
    clientY = 10,
    { pointerId = 1 }: { pointerId?: number } = {},
) {
    const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX,
        clientY,
    });
    Object.defineProperties(event, {
        isPrimary: { value: true },
        pointerId: { value: pointerId },
        pointerType: { value: 'touch' },
    });
    target.dispatchEvent(event);
    return event;
}

async function flushPointerUpdate() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    await flush();
}

describe('Slider pointer interaction', () => {
    it('starts a drag from any point on the track and follows the active pointer', async () => {
        const value = ref(20);
        const onUpdate = vi.fn((nextValue: number) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        ariaLabel: 'Test slider',
                        modelValue: value.value,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const track = container.querySelector('.rp-slider__track') as HTMLElement;
        const thumbTravel = container.querySelector('.rp-slider__thumb') as HTMLElement;
        const input = container.querySelector('input') as HTMLInputElement;
        mockRect(track, { right: 120, width: 120 });
        mockRect(thumbTravel, { left: 10, right: 110, width: 100 });

        const pointerDown = dispatchPointer(input, 'pointerdown', 70, 10, { pointerId: 7 });
        await flush();

        expect(pointerDown.defaultPrevented).toBe(true);
        expect(onUpdate).toHaveBeenLastCalledWith(60);
        expect(value.value).toBe(60);
        expect(document.activeElement).toBe(input);
        expect(root.hasAttribute('data-dragging')).toBe(true);

        dispatchPointer(window, 'pointermove', 100, 10, { pointerId: 7 });
        await flushPointerUpdate();
        expect(onUpdate).toHaveBeenLastCalledWith(90);
        expect(value.value).toBe(90);

        dispatchPointer(window, 'pointerup', 100, 10, { pointerId: 7 });
        await flush();
        expect(root.hasAttribute('data-dragging')).toBe(false);

        const callsAfterPointerUp = onUpdate.mock.calls.length;
        dispatchPointer(window, 'pointermove', 20, 10, { pointerId: 7 });
        await flush();
        expect(onUpdate).toHaveBeenCalledTimes(callsAfterPointerUp);
    });

    it('maps a vertical track drag from bottom to top', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render: () =>
                    h(Slider, {
                        ariaLabel: 'Test slider',
                        modelValue: 20,
                        orientation: 'vertical',
                        step: 5,
                        'onUpdate:modelValue': onUpdate,
                    }),
            }),
        );

        await flush();

        const track = container.querySelector('.rp-slider__track') as HTMLElement;
        const thumbTravel = container.querySelector('.rp-slider__thumb') as HTMLElement;
        mockRect(track, { bottom: 220, height: 220, right: 20, width: 20 });
        mockRect(thumbTravel, { bottom: 210, height: 200, right: 20, top: 10, width: 20 });

        dispatchPointer(track, 'pointerdown', 10, 160);
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(25);
    });

    it('does not start track dragging when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render: () =>
                    h(Slider, {
                        ariaLabel: 'Test slider',
                        disabled: true,
                        modelValue: 20,
                        'onUpdate:modelValue': onUpdate,
                    }),
            }),
        );

        await flush();

        const track = container.querySelector('.rp-slider__track') as HTMLElement;
        mockRect(track);
        const pointerDown = dispatchPointer(track, 'pointerdown', 80);
        await flush();

        expect(pointerDown.defaultPrevented).toBe(false);
        expect(onUpdate).not.toHaveBeenCalled();
    });
});
