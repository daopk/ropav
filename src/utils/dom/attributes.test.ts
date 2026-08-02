import { describe, expect, it, vi } from 'vitest';
import {
    composeEventHandlers,
    hasAttributeToken,
    parseAttributeTokens,
    restoreAttributes,
    splitCompatibilityAttributes,
    snapshotAttributes,
} from './attributes';

describe('DOM attribute utilities', () => {
    it('separates compatibility styles from forwarded attributes', () => {
        const onClick = vi.fn();

        expect(
            splitCompatibilityAttributes({
                id: 'control',
                class: ['consumer-class'],
                style: { color: 'red' },
                onClick,
            }),
        ).toEqual({
            compatibilityClass: ['consumer-class'],
            compatibilityStyle: { color: 'red' },
            forwardedAttributes: {
                id: 'control',
                onClick,
            },
        });
    });

    it('composes event handlers in declaration order and skips missing handlers', () => {
        const calls: string[] = [];
        const event = new Event('input');
        const handler = composeEventHandlers<Event>(
            () => calls.push('internal'),
            undefined,
            () => calls.push('consumer'),
        );

        handler(event);

        expect(calls).toEqual(['internal', 'consumer']);
    });

    it('parses whitespace-separated tokens and matches complete tokens', () => {
        expect(parseAttributeTokens(' dialog   menu\tlistbox ')).toEqual([
            'dialog',
            'menu',
            'listbox',
        ]);
        expect(parseAttributeTokens(null)).toEqual([]);
        expect(hasAttributeToken('dialog menu', 'menu')).toBe(true);
        expect(hasAttributeToken('dialog menu', 'men')).toBe(false);
    });

    it('restores present and absent attributes from a snapshot', () => {
        const element = document.createElement('button');
        element.setAttribute('aria-controls', 'original');
        const snapshot = snapshotAttributes(element, ['aria-controls', 'aria-expanded']);

        element.setAttribute('aria-controls', 'temporary');
        element.setAttribute('aria-expanded', 'true');
        restoreAttributes(element, snapshot);

        expect(element.getAttribute('aria-controls')).toBe('original');
        expect(element.hasAttribute('aria-expanded')).toBe(false);
    });
});
