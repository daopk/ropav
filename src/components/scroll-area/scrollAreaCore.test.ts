import { describe, expect, it } from 'vitest';

import { getLogicalHorizontalPosition, getRawHorizontalPosition } from './scrollAreaCore';

describe('ScrollArea horizontal positions', () => {
    it('keeps LTR positions in native coordinates', () => {
        expect(getLogicalHorizontalPosition(40, 200, 'ltr')).toBe(40);
        expect(getRawHorizontalPosition(40, 200, 'ltr')).toBe(40);
    });

    it('converts RTL negative scroll offsets to logical positions', () => {
        expect(getLogicalHorizontalPosition(0, 200, 'rtl')).toBe(0);
        expect(getLogicalHorizontalPosition(-40, 200, 'rtl')).toBe(40);
        expect(getRawHorizontalPosition(40, 200, 'rtl')).toBe(-40);
    });

    it('clamps logical and raw positions to the scroll range', () => {
        expect(getLogicalHorizontalPosition(-250, 200, 'rtl')).toBe(200);
        expect(getLogicalHorizontalPosition(25, 200, 'rtl')).toBe(0);
        expect(getRawHorizontalPosition(250, 200, 'rtl')).toBe(-200);
        expect(getRawHorizontalPosition(-25, 200, 'ltr')).toBe(0);
    });
});
