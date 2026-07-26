import { describe, expect, it } from 'vitest';
import { isInteractiveElement } from './interactive';

describe('isInteractiveElement', () => {
    it('recognizes interactive elements and their descendants', () => {
        const button = document.createElement('button');
        const icon = document.createElement('span');
        button.append(icon);

        expect(isInteractiveElement(button)).toBe(true);
        expect(isInteractiveElement(icon)).toBe(true);
        expect(isInteractiveElement(document.createElement('div'))).toBe(false);
    });

    it('can ignore a component-owned native control', () => {
        const input = document.createElement('input');
        input.className = 'rp-input__native';

        expect(isInteractiveElement(input)).toBe(true);
        expect(isInteractiveElement(input, '.rp-input__native')).toBe(false);
    });
});
