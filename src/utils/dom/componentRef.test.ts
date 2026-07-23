import { describe, expect, it } from 'vitest';
import type { ComponentPublicInstance, VaporComponentInstance } from 'vue';
import { resolveHTMLElementRef, toHTMLElement } from './componentRef';

describe('component element ref utilities', () => {
    it('resolves direct, Vue public-instance, and Vapor block elements', () => {
        const element = document.createElement('div');

        expect(toHTMLElement(element)).toBe(element);
        expect(toHTMLElement({ $el: element } as ComponentPublicInstance)).toBe(element);
        expect(toHTMLElement({ block: element } as unknown as VaporComponentInstance)).toBe(
            element,
        );
    });

    it('falls back to an element id before resolving', () => {
        const element = document.createElement('div');
        element.id = 'component-ref-fallback';
        document.body.append(element);
        let resolved: HTMLElement | null = null;

        resolveHTMLElementRef(null, element.id, (value) => {
            resolved = value;
        });

        expect(resolved).toBe(element);
    });
});
