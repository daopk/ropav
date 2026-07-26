import { describe, expect, it } from 'vitest';
import { COLOR_PICKER_KEYBOARD_LARGE_STEP, getColorPickerKeyboardValue } from './colorPicker';

describe('getColorPickerKeyboardValue', () => {
    it('moves by the requested arrow-key step', () => {
        expect(getColorPickerKeyboardValue('ArrowRight', 40, 100)).toBe(41);
        expect(
            getColorPickerKeyboardValue('ArrowDown', 40, 100, COLOR_PICKER_KEYBOARD_LARGE_STEP),
        ).toBe(30);
    });

    it('moves to the range boundaries', () => {
        expect(getColorPickerKeyboardValue('Home', 40, 359)).toBe(0);
        expect(getColorPickerKeyboardValue('End', 40, 359)).toBe(359);
    });

    it('ignores unrelated keys', () => {
        expect(getColorPickerKeyboardValue('Enter', 40, 100)).toBeUndefined();
    });
});
