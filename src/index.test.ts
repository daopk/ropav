import { describe, expect, it } from 'vitest';

import { getExpectedRootRuntimeExports } from '../scripts/public-api.mjs';

const Ropav = await import('./index');

describe('public source exports', () => {
    it('matches the exact root runtime contract', () => {
        expect(new Set(Object.keys(Ropav))).toEqual(new Set(getExpectedRootRuntimeExports()));
    });

    it('exposes popover placement options from src/index.ts', () => {
        expect(Ropav.popoverPlacements).toHaveLength(12);
        expect(Ropav.popoverPlacements).toContain('bottom-start');
    });

    it('exposes avatar variants from src/index.ts', () => {
        expect(Ropav.avatarVariants).toEqual(['solid', 'subtle', 'surface', 'outline']);
    });
});
