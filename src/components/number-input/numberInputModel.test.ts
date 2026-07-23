import { describe, expect, it } from 'vitest';
import {
    clampNumberInputValue,
    getModelInputValue,
    normalizeNumberInputBounds,
    normalizeNumberInputControlsPosition,
    normalizeNumberInputStep,
    normalizeNumberInputTextAlign,
    parseNumberInputValue,
    stepNumberInputValue,
} from './numberInputModel';

describe('number input model', () => {
    it('normalizes finite bounds and reverses inverted ranges', () => {
        expect(normalizeNumberInputBounds(10, 0)).toEqual({ min: 0, max: 10 });
        expect(normalizeNumberInputBounds(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({
            min: undefined,
            max: undefined,
        });
        expect(normalizeNumberInputBounds(undefined, 5)).toEqual({
            min: undefined,
            max: 5,
        });
    });

    it('normalizes steps to a positive finite value', () => {
        expect(normalizeNumberInputStep(0.25)).toBe(0.25);
        expect(normalizeNumberInputStep(0)).toBe(1);
        expect(normalizeNumberInputStep(-1)).toBe(1);
        expect(normalizeNumberInputStep(Number.NaN)).toBe(1);
        expect(normalizeNumberInputStep(Number.POSITIVE_INFINITY)).toBe(1);
    });

    it('steps decimal values without drift and clamps them to bounds', () => {
        const bounds = { min: 0.1, max: 0.3 };

        expect(stepNumberInputValue(0.2, 1, 0.1, bounds)).toBe(0.3);
        expect(stepNumberInputValue(0.3, 1, 0.1, bounds)).toBe(0.3);
        expect(stepNumberInputValue(0.2, -1, 0.1, bounds)).toBe(0.1);
        expect(stepNumberInputValue(null, 1, 0.25, { min: undefined, max: undefined })).toBe(0.25);
        expect(stepNumberInputValue(null, -1, 0.25, { min: undefined, max: -1 })).toBe(-1);
    });

    it('keeps overflow results finite when possible', () => {
        expect(
            stepNumberInputValue(Number.MAX_VALUE, 1, Number.MAX_VALUE, {
                min: undefined,
                max: 10,
            }),
        ).toBe(10);
        expect(
            stepNumberInputValue(Number.MAX_VALUE, 1, Number.MAX_VALUE, {
                min: undefined,
                max: undefined,
            }),
        ).toBe(Number.MAX_VALUE);
        expect(clampNumberInputValue(-4, { min: 0, max: 10 })).toBe(0);
    });

    it('parses and serializes only finite model values', () => {
        expect(parseNumberInputValue('12.5')).toBe(12.5);
        expect(parseNumberInputValue('')).toBeNull();
        expect(parseNumberInputValue('not-a-number')).toBeNull();
        expect(parseNumberInputValue('Infinity')).toBeNull();
        expect(getModelInputValue(12.5)).toBe('12.5');
        expect(getModelInputValue(-0)).toBe('0');
        expect(getModelInputValue(null)).toBe('');
        expect(getModelInputValue(Number.NaN)).toBe('');
    });

    it('normalizes presentation options to their documented defaults', () => {
        expect(normalizeNumberInputControlsPosition('left')).toBe('left');
        expect(normalizeNumberInputControlsPosition('split')).toBe('split');
        expect(normalizeNumberInputControlsPosition('invalid' as never)).toBe('right');
        expect(normalizeNumberInputTextAlign('center')).toBe('center');
        expect(normalizeNumberInputTextAlign('right')).toBe('right');
        expect(normalizeNumberInputTextAlign('invalid' as never)).toBe('left');
    });
});
