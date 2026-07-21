import { describe, expect, it } from 'vitest';
import { contrastRatio, mixColors, parseHexColor } from '../../scripts/color-system.mjs';

describe('color system utilities', () => {
    it('parses short and full hex colors consistently', () => {
        expect(parseHexColor('#fff')).toEqual(parseHexColor('#ffffff'));
        expect(parseHexColor('#123')).toEqual({ red: 17, green: 34, blue: 51, alpha: 1 });
    });

    it('calculates the maximum contrast between black and white', () => {
        expect(contrastRatio(parseHexColor('#000'), parseHexColor('#fff'))).toBe(21);
    });

    it('mixes alpha-premultiplied colors', () => {
        expect(
            mixColors(parseHexColor('#f00'), 0.5, { red: 0, green: 0, blue: 0, alpha: 0 }),
        ).toEqual({ red: 255, green: 0, blue: 0, alpha: 0.5 });
    });
});
