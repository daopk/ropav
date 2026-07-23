import { describe, expect, it } from 'vitest';
import { isElement, matchesSelectorSafe, querySelectorAllSafe, querySelectorSafe } from './query';

describe('DOM query utilities', () => {
    it('returns matching elements without throwing for invalid selectors', () => {
        const root = document.createElement('div');
        root.innerHTML = '<button class="match"></button><button class="match"></button>';

        expect(querySelectorSafe<HTMLButtonElement>('.match', root)?.tagName).toBe('BUTTON');
        expect(querySelectorAllSafe('.match', root)).toHaveLength(2);
        expect(querySelectorSafe('[', root)).toBeNull();
        expect(querySelectorAllSafe('[', root)).toEqual([]);
        expect(matchesSelectorSafe(root.firstElementChild!, '.match')).toBe(true);
        expect(matchesSelectorSafe(root.firstElementChild!, '[')).toBe(false);
    });

    it('recognizes foreign-realm and adopted elements', () => {
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const foreignElement = frame.contentDocument!.createElement('div');

        expect(isElement(foreignElement)).toBe(true);
        expect(isElement(document.adoptNode(foreignElement))).toBe(true);
        expect(isElement({})).toBe(false);
    });
});
