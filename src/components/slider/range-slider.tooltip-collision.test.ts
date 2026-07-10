import { describe, expect, it } from 'vitest';

import { areRangeSliderTooltipRectsOverlapping } from './useRangeSliderTooltipCollision';

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
});
