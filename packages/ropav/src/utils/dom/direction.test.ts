import { describe, expect, it } from 'vitest';
import { getElementDirection } from './direction';

describe('DOM direction utilities', () => {
    it('reads the effective direction inherited from an ancestor', () => {
        const host = document.createElement('div');
        const element = document.createElement('span');
        host.dir = 'rtl';
        host.append(element);
        document.body.append(host);

        expect(getElementDirection(element)).toBe('rtl');

        host.dir = 'ltr';
        expect(getElementDirection(element)).toBe('ltr');
    });

    it('falls back to LTR when a browsing context is unavailable', () => {
        const detachedDocument = document.implementation.createHTMLDocument();
        const element = detachedDocument.createElement('span');
        element.style.direction = 'rtl';

        expect(getElementDirection(element)).toBe('ltr');
    });
});
