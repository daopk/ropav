import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import { useSliderPointerPreview } from './useSliderPointerPreview';

function setRect(element: HTMLElement, rect: Partial<DOMRect>) {
    Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: () =>
            ({
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
            }) as DOMRect,
    });
}

function pointerEvent(
    currentTarget: EventTarget,
    values: Partial<PointerEvent> = {},
): PointerEvent {
    return {
        button: 0,
        clientX: 0,
        clientY: 0,
        isPrimary: true,
        pointerId: 7,
        currentTarget,
        ...values,
    } as PointerEvent;
}

function dispatchPointerUp(pointerId: number, clientX: number) {
    const event = new MouseEvent('pointerup', { clientX });
    Object.defineProperty(event, 'pointerId', { value: pointerId });
    window.dispatchEvent(event);
}

describe('useSliderPointerPreview', () => {
    it('projects pointer values and owns the matching drag lifecycle', () => {
        const state = reactive({
            enabled: true,
            disabled: false,
            min: 0,
            max: 100,
            step: 5 as number | 'any',
        });
        const onStateChange = vi.fn();
        let preview!: ReturnType<typeof useSliderPointerPreview>;
        const { container } = mountDomWithApp(
            defineComponent({
                setup() {
                    preview = useSliderPointerPreview({
                        enabled: () => state.enabled,
                        disabled: () => state.disabled,
                        orientation: () => 'horizontal',
                        bounds: computed(() => ({ min: state.min, max: state.max })),
                        step: computed(() => state.step),
                        initialValue: 20,
                        onStateChange,
                    });
                    return () => h('div', [h('span', { class: 'rp-slider__travel' })]);
                },
            }),
        );
        const track = container.firstElementChild as HTMLElement;
        const travel = track.firstElementChild as HTMLElement;
        setRect(travel, { left: 10, right: 90, width: 80 });

        preview.onTrackEnter(pointerEvent(track, { clientX: 49 }));
        expect(preview.previewAvailable.value).toBe(true);
        expect(preview.previewValue.value).toBe(50);

        expect(preview.onPointerDown(pointerEvent(track, { clientX: 25 }))).toBe(true);
        expect(preview.dragging.value).toBe(true);

        dispatchPointerUp(8, 80);
        expect(preview.dragging.value).toBe(true);

        dispatchPointerUp(7, 74);
        expect(preview.dragging.value).toBe(false);
        expect(preview.previewValue.value).toBe(80);
        expect(onStateChange).toHaveBeenCalled();
    });
});
