import { describe, expect, it } from 'vitest';
import { isElement, querySelectorAllSafe, querySelectorSafe } from './query';

describe('DOM query utilities', () => {
    it('returns matching elements without throwing for invalid selectors', () => {
        const root = document.createElement('div');
        root.innerHTML = '<button class="match"></button><button class="match"></button>';

        expect(querySelectorSafe<HTMLButtonElement>('.match', root)?.tagName).toBe('BUTTON');
        expect(querySelectorAllSafe('.match', root)).toHaveLength(2);
        expect(querySelectorSafe('[', root)).toBeNull();
        expect(querySelectorAllSafe('[', root)).toEqual([]);
    });

    it('recognizes elements created in another document realm', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);

        expect(isElement(frame.contentDocument!.createElement('div'))).toBe(true);
        expect(isElement({})).toBe(false);
    });
});
