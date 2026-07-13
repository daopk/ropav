import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import type { TooltipPlacement } from '../tooltip/types';
import { areRangeSliderTooltipLayoutsOverlapping } from './useRangeSliderTooltipCollision';
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

function resizeEntry(target: Element, width: number, height: number) {
    return {
        borderBoxSize: [{ blockSize: height, inlineSize: width }],
        contentRect: { height, width },
        target,
    } as unknown as ResizeObserverEntry;
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

    it('treats a larger gap as a wider collision zone', () => {
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

    it('calculates horizontal collisions for every placement', () => {
        const placements: TooltipPlacement[] = ['top', 'right', 'bottom', 'left'];

        for (const placement of placements) {
            const layout = {
                lowerSize: { width: 20, height: 20 },
                orientation: 'horizontal' as const,
                placement,
                trackLength: 100,
                upperSize: { width: 20, height: 20 },
            };

            expect(
                areRangeSliderTooltipLayoutsOverlapping({
                    ...layout,
                    lowerPercent: 10,
                    upperPercent: 90,
                }),
            ).toBe(false);
            expect(
                areRangeSliderTooltipLayoutsOverlapping({
                    ...layout,
                    lowerPercent: 45,
                    upperPercent: 55,
                }),
            ).toBe(true);
        }
    });

    it('calculates vertical collisions for every placement', () => {
        const placements: TooltipPlacement[] = ['top', 'right', 'bottom', 'left'];

        for (const placement of placements) {
            const layout = {
                lowerSize: { width: 20, height: 20 },
                orientation: 'vertical' as const,
                placement,
                trackLength: 100,
                upperSize: { width: 20, height: 20 },
            };

            expect(
                areRangeSliderTooltipLayoutsOverlapping({
                    ...layout,
                    lowerPercent: 10,
                    upperPercent: 90,
                }),
            ).toBe(false);
            expect(
                areRangeSliderTooltipLayoutsOverlapping({
                    ...layout,
                    lowerPercent: 45,
                    upperPercent: 55,
                }),
            ).toBe(true);
        }
    });

    it('accounts for different content sizes and gap width', () => {
        const layout = {
            lowerPercent: 20,
            lowerSize: { width: 20, height: 20 },
            orientation: 'horizontal' as const,
            placement: 'top' as const,
            trackLength: 100,
            upperPercent: 44,
            upperSize: { width: 20, height: 20 },
        };

        expect(areRangeSliderTooltipLayoutsOverlapping({ ...layout, gap: 4 })).toBe(false);
        expect(areRangeSliderTooltipLayoutsOverlapping({ ...layout, gap: 8 })).toBe(true);
        expect(
            areRangeSliderTooltipLayoutsOverlapping({
                ...layout,
                lowerSize: { width: 70, height: 20 },
                upperPercent: 80,
                upperSize: { width: 70, height: 20 },
            }),
        ).toBe(true);
    });

    it('uses cached ResizeObserver sizes during value updates', async () => {
        let resizeCallback: ResizeObserverCallback | undefined;
        const originalResizeObserver = window.ResizeObserver;

        class FakeResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                resizeCallback = callback;
            }

            disconnect() {}
            observe() {}
            unobserve() {}
        }

        window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;

        const valuePercent = ref<[number, number]>([10, 90]);
        let overlapping: Ref<boolean> | undefined;

        const container = mountDom(
            defineComponent({
                setup() {
                    const root = ref<HTMLElement | null>(null);
                    const lower = ref<HTMLElement | null>(null);
                    const upper = ref<HTMLElement | null>(null);
                    overlapping = useRangeSliderTooltipCollision({
                        enabled: ref(true),
                        lower,
                        orientation: ref<'horizontal' | 'vertical'>('horizontal'),
                        placement: ref<TooltipPlacement>('top'),
                        root,
                        upper,
                        valuePercent,
                    }).tooltipsOverlapping;

                    return () =>
                        h('div', { ref: root }, [
                            h('div', { ref: lower }),
                            h('div', { ref: upper }),
                        ]);
                },
            }),
        );

        await flush();

        const root = container.firstElementChild as HTMLElement;
        const [lower, upper] = [...root.children] as HTMLElement[];
        const rootRect = vi.spyOn(root, 'getBoundingClientRect');
        const lowerRect = vi.spyOn(lower, 'getBoundingClientRect');
        const upperRect = vi.spyOn(upper, 'getBoundingClientRect');
        resizeCallback?.(
            [resizeEntry(root, 100, 20), resizeEntry(lower, 20, 20), resizeEntry(upper, 20, 20)],
            {} as ResizeObserver,
        );
        expect(overlapping?.value).toBe(false);

        valuePercent.value = [20, 80];
        await flush();
        valuePercent.value = [30, 70];
        await flush();
        expect(rootRect).not.toHaveBeenCalled();
        expect(lowerRect).not.toHaveBeenCalled();
        expect(upperRect).not.toHaveBeenCalled();

        valuePercent.value = [45, 55];
        await flush();
        expect(overlapping?.value).toBe(true);

        window.ResizeObserver = originalResizeObserver;
    });

    it('sizes the merged box to preserve the pre-merge arrow-to-edge distance', async () => {
        let resizeCallback: ResizeObserverCallback | undefined;
        const originalResizeObserver = window.ResizeObserver;

        class FakeResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                resizeCallback = callback;
            }

            disconnect() {}
            observe() {}
            unobserve() {}
        }

        window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;

        const valuePercent = ref<[number, number]>([10, 90]);
        let collision: ReturnType<typeof useRangeSliderTooltipCollision> | undefined;

        const container = mountDom(
            defineComponent({
                setup() {
                    const root = ref<HTMLElement | null>(null);
                    const lower = ref<HTMLElement | null>(null);
                    const upper = ref<HTMLElement | null>(null);
                    collision = useRangeSliderTooltipCollision({
                        enabled: ref(true),
                        lower,
                        orientation: ref<'horizontal' | 'vertical'>('horizontal'),
                        placement: ref<TooltipPlacement>('top'),
                        root,
                        upper,
                        valuePercent,
                    });

                    return () =>
                        h('div', { ref: root }, [
                            h('div', { ref: lower }),
                            h('div', { ref: upper }),
                        ]);
                },
            }),
        );

        await flush();

        const root = container.firstElementChild as HTMLElement;
        const [lower, upper] = [...root.children] as HTMLElement[];
        // Track 100px wide, each endpoint tooltip 40px wide (arrow-to-edge = 20px).
        resizeCallback?.(
            [resizeEntry(root, 100, 20), resizeEntry(lower, 40, 20), resizeEntry(upper, 40, 20)],
            {} as ResizeObserver,
        );

        // Separated: merged box must not inflate while the endpoint tooltips are shown.
        expect(collision?.tooltipsOverlapping.value).toBe(false);
        expect(collision?.mergedMinSize.value).toBe(0);

        // Merged: min size = thumb distance + widest endpoint, so each arrow keeps its
        // pre-merge 20px margin (min size / 2 - arrow offset).
        valuePercent.value = [45, 55];
        await flush();
        expect(collision?.tooltipsOverlapping.value).toBe(true);
        expect(collision?.mergedArrowOffset.value).toBe(5);
        expect(collision?.mergedMinSize.value).toBe(50);

        window.ResizeObserver = originalResizeObserver;
    });
});
