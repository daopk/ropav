import { describe, expect, it } from 'vitest';
import {
    applyFallbackScrollPosition,
    getKeyboardScrollPosition,
    getLogicalHorizontalScrollPosition,
    getPointerAxisCoordinate,
    getRawHorizontalScrollPosition,
    getScrollDirection,
    getScrollThumbGeometry,
    getScrollThumbOffset,
    getWheelScrollDelta,
} from './scroll';

describe('DOM scroll utilities', () => {
    it('reads direction and converts between raw and logical horizontal positions', () => {
        const element = document.createElement('div');
        element.style.direction = 'rtl';

        expect(getScrollDirection(element)).toBe('rtl');
        expect(getLogicalHorizontalScrollPosition(-40, 100, 'rtl')).toBe(40);
        expect(getLogicalHorizontalScrollPosition(120, 100, 'ltr')).toBe(100);
        expect(getRawHorizontalScrollPosition(40, 100, 'rtl')).toBe(-40);
        expect(getRawHorizontalScrollPosition(-20, 100, 'ltr')).toBe(0);
        expect(Object.is(getRawHorizontalScrollPosition(0, 100, 'rtl'), -0)).toBe(false);
    });

    it('calculates thumb geometry and position from scroll dimensions', () => {
        expect(getScrollThumbGeometry(0, 100, 400, 18)).toEqual({
            size: 100,
            offsetRatio: 1,
        });
        expect(getScrollThumbGeometry(200, 100, 500, 18)).toEqual({
            size: 20,
            offsetRatio: 0.2,
        });
        expect(getScrollThumbGeometry(100, 1, 1000, 18)).toEqual({
            size: 18,
            offsetRatio: 0.18,
        });
        expect(getScrollThumbOffset(150, 300, 0.25)).toBe(150);
        expect(getScrollThumbOffset(20, 0, 0.25)).toBe(0);
        expect(getScrollThumbOffset(20, 100, 1)).toBe(0);
    });

    it('maps keyboard and wheel input to axis-aware scroll movement', () => {
        const base = {
            axis: 'x' as const,
            current: 50,
            pageSize: 100,
            maxPosition: 300,
            lineStep: 40,
        };

        expect(getKeyboardScrollPosition({ ...base, key: 'ArrowLeft', direction: 'ltr' })).toBe(10);
        expect(getKeyboardScrollPosition({ ...base, key: 'ArrowLeft', direction: 'rtl' })).toBe(90);
        expect(getKeyboardScrollPosition({ ...base, key: 'PageDown', direction: 'ltr' })).toBe(150);
        expect(getKeyboardScrollPosition({ ...base, key: 'End', direction: 'ltr' })).toBe(300);
        expect(
            getKeyboardScrollPosition({ ...base, key: 'Escape', direction: 'ltr' }),
        ).toBeUndefined();

        expect(getWheelScrollDelta('y', { deltaX: 20, deltaY: 30 }, 'rtl')).toBe(30);
        expect(getWheelScrollDelta('x', { deltaX: 20, deltaY: 30 }, 'ltr')).toBe(20);
        expect(getWheelScrollDelta('x', { deltaX: 20, deltaY: 30 }, 'rtl')).toBe(-20);
        expect(getWheelScrollDelta('x', { deltaX: 0, deltaY: 30 }, 'rtl')).toBe(30);
    });

    it('applies fallback positions and reads pointer coordinates by axis', () => {
        const element = document.createElement('div');
        element.scrollLeft = 10;
        element.scrollTop = 20;

        applyFallbackScrollPosition(element, { left: 30, top: 40 }, 'absolute');
        expect({ left: element.scrollLeft, top: element.scrollTop }).toEqual({
            left: 30,
            top: 40,
        });

        applyFallbackScrollPosition(element, { left: 5, top: -10 }, 'relative');
        expect({ left: element.scrollLeft, top: element.scrollTop }).toEqual({
            left: 35,
            top: 30,
        });

        expect(getPointerAxisCoordinate('x', { clientX: 12, clientY: 34 })).toBe(12);
        expect(getPointerAxisCoordinate('y', { clientX: 12, clientY: 34 })).toBe(34);
    });
});
