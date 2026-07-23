import { describe, expect, it } from 'vitest';

import { toOptionalAttribute, toPresenceAttribute } from './attributes';

describe('attribute utilities', () => {
    it('maps truthy state to an empty presence attribute', () => {
        expect(toPresenceAttribute(true)).toBe('');
        expect(toPresenceAttribute('active')).toBe('');
        expect(toPresenceAttribute(false)).toBeUndefined();
        expect(toPresenceAttribute(undefined)).toBeUndefined();
    });

    it('preserves non-empty optional attributes', () => {
        expect(toOptionalAttribute(true)).toBe(true);
        expect(toOptionalAttribute('label')).toBe('label');
        expect(toOptionalAttribute(false)).toBeUndefined();
        expect(toOptionalAttribute('')).toBeUndefined();
    });
});
