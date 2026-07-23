import { describe, expect, it } from 'vitest';

const Ropav = await import('./index');

describe('public source exports', () => {
    it('exposes popover placement options from src/index.ts', () => {
        expect(Ropav.popoverPlacements).toHaveLength(12);
        expect(Ropav.popoverPlacements).toContain('bottom-start');
    });

    it('exposes avatar variants from src/index.ts', () => {
        expect(Ropav.avatarVariants).toEqual(['solid', 'subtle', 'surface', 'outline']);
    });
});
