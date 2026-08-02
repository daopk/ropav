import { describe, expect, it } from 'vitest';
import { clampPointToRect, createPointRect, isPointInRect, isPointInTriangle } from './geometry';

describe('geometry utilities', () => {
    const rect = { left: 10, right: 30, top: 20, bottom: 40, width: 20, height: 20 };

    it('checks and clamps points against rectangle bounds', () => {
        expect(isPointInRect({ x: 15, y: 25 }, rect)).toBe(true);
        expect(isPointInRect({ x: 8, y: 18 }, rect, 2)).toBe(true);
        expect(clampPointToRect({ x: 5, y: 50 }, rect)).toEqual({ x: 10, y: 40 });
    });

    it('checks triangle containment and creates zero-area point rectangles', () => {
        expect(
            isPointInTriangle({ x: 2, y: 2 }, [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 0, y: 10 },
            ]),
        ).toBe(true);
        expect(createPointRect({ x: 4, y: 6 })).toMatchObject({
            x: 4,
            y: 6,
            left: 4,
            right: 4,
            top: 6,
            bottom: 6,
            width: 0,
            height: 0,
        });
    });
});
