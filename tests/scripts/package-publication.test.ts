import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import {
    createPackagePublicationBuildEntries,
    synchronizePackagePublication,
    verifyBuiltPackagePublication,
} from '../../scripts/package-publication.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureRoots: string[] = [];

afterEach(() => {
    for (const fixtureRoot of fixtureRoots.splice(0)) {
        rmSync(fixtureRoot, { force: true, recursive: true });
    }
});

describe('Package Publication', () => {
    it('creates the complete build entry inventory through its interface', () => {
        const fixtureRoot = createProjectFixture();
        const entries = createPackagePublicationBuildEntries(fixtureRoot);
        const expectedComponentEntries = getRepositoryComponentNames().map(
            (name: string) => `components/${name}/index`,
        );

        expect(entries.index).toBe(join(fixtureRoot, 'src/index.ts'));
        expect(entries.base).toBe(join(fixtureRoot, 'src/styles/base.scss'));
        expect(entries['composables/index']).toBe(join(fixtureRoot, 'src/composables/index.ts'));
        expect(entries['unplugin-icons']).toBe(join(fixtureRoot, 'src/unplugin-icons.ts'));
        expect(
            new Set(Object.keys(entries).filter((name) => name.startsWith('components/'))),
        ).toEqual(new Set(expectedComponentEntries));
    });

    it('reports a synchronized fixture as current', () => {
        const fixtureRoot = createProjectFixture();

        expect(synchronizePackagePublication(fixtureRoot, { mode: 'check' })).toEqual({
            issues: [],
            writtenFiles: [],
        });
    });

    it('reports generated drift without changing files in check mode', () => {
        const fixtureRoot = createProjectFixture();
        const indexPath = join(fixtureRoot, 'src/index.ts');
        const packagePath = join(fixtureRoot, 'package.json');
        const packageJson = readPackageJson(packagePath);

        writeFileSync(indexPath, `${readFileSync(indexPath, 'utf8')}export const stale = true;\n`);
        packageJson.exports['./button'].import = './dist/components/wrong/index.js';
        writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

        const indexBeforeCheck = readFileSync(indexPath, 'utf8');
        const packageBeforeCheck = readFileSync(packagePath, 'utf8');
        const { issues, writtenFiles } = synchronizePackagePublication(fixtureRoot, {
            mode: 'check',
        });

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'generated-artifact-stale',
                    target: 'src/index.ts',
                }),
                expect.objectContaining({
                    code: 'generated-artifact-stale',
                    target: 'package.json#exports["./button"]',
                }),
            ]),
        );
        expect(writtenFiles).toEqual([]);
        expect(readFileSync(indexPath, 'utf8')).toBe(indexBeforeCheck);
        expect(readFileSync(packagePath, 'utf8')).toBe(packageBeforeCheck);
    });

    it('writes only stale files and preserves unrelated package metadata', () => {
        const fixtureRoot = createProjectFixture();
        const indexPath = join(fixtureRoot, 'src/index.ts');
        const packagePath = join(fixtureRoot, 'package.json');
        const packageJson = readPackageJson(packagePath);

        writeFileSync(indexPath, `${readFileSync(indexPath, 'utf8')}export const stale = true;\n`);
        packageJson.exports['./button'].import = './dist/components/wrong/index.js';
        packageJson.fixtureMetadata = { preserved: true };
        writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

        expect(synchronizePackagePublication(fixtureRoot, { mode: 'write' })).toEqual({
            issues: [],
            writtenFiles: ['src/index.ts', 'package.json'],
        });
        expect(readPackageJson(packagePath).fixtureMetadata).toEqual({ preserved: true });
        expect(synchronizePackagePublication(fixtureRoot, { mode: 'check' })).toEqual({
            issues: [],
            writtenFiles: [],
        });
    });

    it('throws when the source inventory contains an undeclared module', () => {
        const fixtureRoot = createProjectFixture();
        createSourceFile(fixtureRoot, 'src/components/private-module/index.ts');

        expect(() => createPackagePublicationBuildEntries(fixtureRoot)).toThrow(
            'Package publication source inventory differs: unexpected private-module',
        );
    });

    it('throws when a declared source entry is missing', () => {
        const fixtureRoot = createProjectFixture();
        const componentName = getRepositoryComponentNames()[0];
        rmSync(join(fixtureRoot, `src/components/${componentName}/index.ts`));

        expect(() => synchronizePackagePublication(fixtureRoot, { mode: 'check' })).toThrow(
            `./${componentName} source entry does not exist: src/components/${componentName}/index.ts`,
        );
    });

    it('reports missing built targets without loading unavailable modules', async () => {
        const fixtureRoot = createProjectFixture();
        const { issues } = await verifyBuiltPackagePublication(fixtureRoot);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'package-target-missing',
                    target: './dist/index.js',
                }),
            ]),
        );
    });
});

function createProjectFixture() {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'ropav-package-publication-'));
    fixtureRoots.push(fixtureRoot);

    copyRepositoryFile(fixtureRoot, 'src/index.ts');
    copyRepositoryFile(fixtureRoot, 'package.json');
    createSourceFile(fixtureRoot, 'src/composables/index.ts');
    createSourceFile(fixtureRoot, 'src/unplugin-icons.ts');
    createSourceFile(fixtureRoot, 'src/styles/base.scss');

    for (const componentName of getRepositoryComponentNames()) {
        createSourceFile(fixtureRoot, `src/components/${componentName}/index.ts`);
    }

    return fixtureRoot;
}

function getRepositoryComponentNames(): string[] {
    return readdirSync(join(repositoryRoot, 'src/components'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map(({ name }) => name);
}

function copyRepositoryFile(fixtureRoot: string, relativePath: string) {
    createSourceFile(
        fixtureRoot,
        relativePath,
        readFileSync(join(repositoryRoot, relativePath), 'utf8'),
    );
}

function createSourceFile(fixtureRoot: string, relativePath: string, source = '') {
    const filePath = join(fixtureRoot, relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, source);
}

function readPackageJson(packagePath: string) {
    return JSON.parse(readFileSync(packagePath, 'utf8'));
}
