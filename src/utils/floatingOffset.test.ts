import { describe, expect, it } from 'vitest';
import { getFloatingOffsetStyle } from './floatingOffset';

const properties = {
    mainAxis: '--test-main-axis-offset',
    crossAxis: '--test-cross-axis-offset',
} as const;

describe('getFloatingOffsetStyle', () => {
    it('maps a numeric offset to the main axis property', () => {
        expect(getFloatingOffsetStyle(12, properties)).toEqual({
            '--test-main-axis-offset': '12px',
        });
    });

    it('maps axis offsets to their configured properties', () => {
        expect(getFloatingOffsetStyle({ mainAxis: 20, crossAxis: -6 }, properties)).toEqual({
            '--test-main-axis-offset': '20px',
            '--test-cross-axis-offset': '-6px',
        });
    });

    it('omits missing offsets', () => {
        expect(getFloatingOffsetStyle(undefined, properties)).toBeUndefined();
        expect(getFloatingOffsetStyle({}, properties)).toBeUndefined();
    });
});
