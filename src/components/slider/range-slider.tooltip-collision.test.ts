import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import { areRangeSliderTooltipRectsOverlapping } from './useRangeSliderTooltipCollision';
import { useRangeSliderTooltipCollision } from './useRangeSliderTooltipCollision';

function rect(left: number, top: number, width: number, height: number) {
    return {
        bottom: top + height,
        height,
        left,
        right: left + width,
        top,
        width,
    };
}

describe('RangeSlider tooltip collision', () => {
    it('keeps separated tooltip rectangles on the same layer', () => {
        expect(
            areRangeSliderTooltipRectsOverlapping(rect(20, 10, 32, 28), rect(80, 10, 32, 28)),
        ).toBe(false);
    });

    it('detects overlapping and nearly touching tooltip rectangles', () => {
        expect(
            areRangeSliderTooltipRectsOverlapping(rect(40, 10, 32, 28), rect(40, 10, 32, 28)),
        ).toBe(true);
        expect(areRangeSliderTooltipRectsOverlapping(rect(0, 0, 32, 28), rect(35, 0, 32, 28))).toBe(
            true,
        );
    });

    it('supports a wider release gap to prevent collision state chatter', () => {
        const lower = rect(0, 0, 32, 28);
        const upper = rect(38, 0, 32, 28);

        expect(areRangeSliderTooltipRectsOverlapping(lower, upper, 4)).toBe(false);
        expect(areRangeSliderTooltipRectsOverlapping(lower, upper, 8)).toBe(true);
    });

    it('ignores tooltip rectangles without a rendered size', () => {
        expect(areRangeSliderTooltipRectsOverlapping(rect(0, 0, 0, 28), rect(0, 0, 32, 28))).toBe(
            false,
        );
    });

    it('remeasures from explicit dependencies instead of unrelated component updates', async () => {
        const dependency = ref(0);
        const unrelated = ref(0);
        let overlapping: Ref<boolean> | undefined;
        const frames: FrameRequestCallback[] = [];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            frames.push(callback);
            return frames.length;
        });

        const container = mountDom(
            defineComponent({
                setup() {
                    const root = ref<HTMLElement | null>(null);
                    overlapping = useRangeSliderTooltipCollision(root, [
                        dependency,
                    ]).tooltipsOverlapping;

                    return () =>
                        h('div', { ref: root, 'data-unrelated': unrelated.value }, [
                            h('div', { class: 'rp-range-slider__tooltip--lower' }, [
                                h('div', { class: 'rp-tooltip__content' }),
                            ]),
                            h('div', { class: 'rp-range-slider__tooltip--upper' }, [
                                h('div', { class: 'rp-tooltip__content' }),
                            ]),
                        ]);
                },
            }),
        );

        await flush();

        const [lower, upper] = [...container.querySelectorAll<HTMLElement>('.rp-tooltip__content')];
        vi.spyOn(lower, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 20, 20) as DOMRect);
        const upperRect = vi
            .spyOn(upper, 'getBoundingClientRect')
            .mockReturnValue(rect(80, 0, 20, 20) as DOMRect);

        frames.shift()?.(0);
        expect(overlapping?.value).toBe(false);

        unrelated.value += 1;
        await flush();
        expect(frames).toHaveLength(0);

        upperRect.mockReturnValue(rect(10, 0, 20, 20) as DOMRect);
        dependency.value += 1;
        await flush();
        expect(frames).toHaveLength(1);
        frames.shift()?.(0);
        expect(overlapping?.value).toBe(true);
    });
});
