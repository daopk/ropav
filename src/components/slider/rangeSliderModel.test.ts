import { describe, expect, it } from 'vitest';
import { getRangeSliderPointerValue } from './rangeSliderModel';

describe('range slider model', () => {
    it('maps and clamps plain pointer coordinates across both orientations', () => {
        const bounds = { min: 20, max: 80 };

        expect(
            getRangeSliderPointerValue(
                { clientX: 60, clientY: 0 },
                { length: 100, start: 10, vertical: false },
                bounds,
            ),
        ).toBe(50);
        expect(
            getRangeSliderPointerValue(
                { clientX: -20, clientY: 0 },
                { length: 100, start: 10, vertical: false },
                bounds,
            ),
        ).toBe(20);
        expect(
            getRangeSliderPointerValue(
                { clientX: 0, clientY: 60 },
                { length: 100, start: 110, vertical: true },
                bounds,
            ),
        ).toBe(50);
        expect(
            getRangeSliderPointerValue(
                { clientX: 0, clientY: -20 },
                { length: 100, start: 110, vertical: true },
                bounds,
            ),
        ).toBe(80);
    });
});
