import { describe, expect, it } from 'vitest';

import {
    assertExactNames,
    createExpectedPackageExports,
    getGeneratedArtifactIssues,
    getPackageExportIssues,
    publicApiManifest,
    renderRootIndex,
    validatePublicApiManifest,
} from '../../scripts/public-api.mjs';

describe('public API manifest', () => {
    it('is internally valid and declares every explicit component subpath', () => {
        expect(() => validatePublicApiManifest()).not.toThrow();

        const packageExports = createExpectedPackageExports();
        expect(
            publicApiManifest.components.every(({ name }) =>
                Object.hasOwn(packageExports, `./${name}`),
            ),
        ).toBe(true);
    });

    it('reports missing and unexpected component inventory entries', () => {
        expect(() =>
            assertExactNames(
                ['alert', 'private-component'],
                ['alert', 'button'],
                'Public component inventory',
            ),
        ).toThrow(
            'Public component inventory differs: missing button; unexpected private-component',
        );
    });

    it('reports missing and unexpected runtime symbols', () => {
        expect(() =>
            assertExactNames(
                ['Button', 'unexpectedExport'],
                ['Button', 'buttonParts'],
                './button public runtime exports',
            ),
        ).toThrow(
            './button public runtime exports differs: missing buttonParts; unexpected unexpectedExport',
        );
    });

    it('reports generated root barrels that are stale', () => {
        expect(
            getGeneratedArtifactIssues({
                indexSource: `${renderRootIndex()}export const stale = true;\n`,
                packageJson: createPackageJsonFixture(),
            }),
        ).toContain('src/index.ts is not synchronized with the public API manifest');
    });

    it('reports package targets that differ from the manifest', () => {
        const packageExports = createExpectedPackageExports();
        const buttonEntry = packageExports['./button'];
        if (typeof buttonEntry === 'string') throw new Error('./button must be a module export');
        buttonEntry.import = './dist/components/wrong/index.js';

        expect(getPackageExportIssues(packageExports, createExpectedPackageExports())).toEqual([
            'package.json#exports["./button"] differs from the manifest',
        ]);
    });
});

function createPackageJsonFixture() {
    return {
        main: publicApiManifest.root.import,
        module: publicApiManifest.root.import,
        types: publicApiManifest.root.types,
        exports: createExpectedPackageExports(),
    };
}
