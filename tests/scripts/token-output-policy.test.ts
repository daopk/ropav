import { describe, expect, it } from 'vitest';
import { hasCssCustomProperty, isPublicToken } from '../../scripts/token-output-policy.mjs';
import { createPublicStylesManifest } from '../../scripts/public-styles-manifest.mjs';

function token(path: string, ropav: Record<string, unknown> = {}) {
    return {
        key: `{${path}}`,
        $extensions: { ropav },
    };
}

describe('token output policy', () => {
    it('does not make an emitted token public implicitly', () => {
        const internalSpacingToken = token('spacing.internal');

        expect(hasCssCustomProperty(internalSpacingToken)).toBe(true);
        expect(isPublicToken(internalSpacingToken)).toBe(false);
    });

    it('requires an explicit public opt-in', () => {
        expect(isPublicToken(token('spacing.stable', { public: true }))).toBe(true);
        expect(isPublicToken(token('spacing.private', { public: false }))).toBe(false);
    });

    it('keeps emitted internal tokens out of the public manifest', () => {
        const manifest = createPublicStylesManifest(
            {
                allTokens: [token('spacing.internal'), token('spacing.stable', { public: true })],
            },
            new Set(),
        );
        const sourcePaths = manifest.tokens.map(
            ({ sourcePath }: { sourcePath: string }) => sourcePath,
        );

        expect(sourcePaths).toContain('spacing.stable');
        expect(sourcePaths).not.toContain('spacing.internal');
    });
});
