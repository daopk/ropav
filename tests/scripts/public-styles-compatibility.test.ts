import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error The build scripts are plain JavaScript modules without declaration files.
import * as compatibility from '../../scripts/public-styles-compatibility.mjs';

const { checkReleasedPublicStylesCompatibility, comparePublicStylesManifests } = compatibility;

const temporaryRepositories: string[] = [];

afterEach(() => {
    for (const repository of temporaryRepositories.splice(0)) {
        rmSync(repository, { recursive: true, force: true });
    }
});

function manifest({
    contractVersion = 1,
    tokens = [token()],
    componentVariables = [componentVariable()],
} = {}) {
    return { schemaVersion: 1, contractVersion, tokens, componentVariables };
}

function token(overrides: Record<string, unknown> = {}) {
    return {
        name: '--rp-color-text',
        sourcePath: 'color.text',
        type: 'color',
        category: 'color',
        description: 'Readable text color.',
        themeApplicability: 'light-and-dark',
        ...overrides,
    };
}

function componentVariable(overrides: Record<string, unknown> = {}) {
    return {
        name: '--rp-slider-track-size',
        component: 'Slider',
        acceptedValue: '<length>',
        fallback: '0.5rem',
        description: 'Slider track size.',
        ...overrides,
    };
}

describe('public styles compatibility', () => {
    it('accepts documentation-only changes', () => {
        const released = manifest();
        const current = manifest({
            tokens: [token({ description: 'Updated documentation.' })],
            componentVariables: [
                componentVariable({ description: 'Updated component documentation.' }),
            ],
        });

        expect(comparePublicStylesManifests(released, current)).toEqual([]);
    });

    it('blocks removing or renaming a released stable token', () => {
        const released = manifest();
        const current = manifest({ tokens: [token({ name: '--rp-color-content' })] });

        expect(comparePublicStylesManifests(released, current)).toContain(
            'released baseline stable token --rp-color-text was removed or renamed',
        );
    });

    it.each([
        ['sourcePath', 'color.content'],
        ['type', 'string'],
        ['category', 'content'],
        ['themeApplicability', 'all-themes'],
    ])('blocks changing token %s semantics', (field, value) => {
        const released = manifest();
        const current = manifest({ tokens: [token({ [field]: value })] });

        expect(comparePublicStylesManifests(released, current).join('\n')).toContain(
            `stable token --rp-color-text changed ${field}`,
        );
    });

    it('blocks changing component-variable semantics', () => {
        const released = manifest();
        const current = manifest({
            componentVariables: [componentVariable({ acceptedValue: '<percentage>' })],
        });

        expect(comparePublicStylesManifests(released, current).join('\n')).toContain(
            'stable component variable --rp-slider-track-size changed acceptedValue',
        );
    });

    it('requires a contract version increase for additions', () => {
        const released = manifest({ contractVersion: 3 });
        const current = manifest({
            contractVersion: 3,
            tokens: [token(), token({ name: '--rp-color-surface', sourcePath: 'color.surface' })],
        });

        expect(comparePublicStylesManifests(released, current).join('\n')).toContain(
            'contractVersion must increase above 3 when adding token --rp-color-surface',
        );
    });

    it('accepts additions with a newer contract version', () => {
        const released = manifest({ contractVersion: 3 });
        const current = manifest({
            contractVersion: 4,
            tokens: [token(), token({ name: '--rp-color-surface', sourcePath: 'color.surface' })],
        });

        expect(comparePublicStylesManifests(released, current)).toEqual([]);
    });

    it('reads the baseline manifest from the release tag, not the working tree', () => {
        const released = manifest();
        const repository = createTaggedRepository({
            'src/styles/styles-manifest.json': JSON.stringify(released),
        });
        const bootstrapped = manifest({ tokens: [] });
        writeRepositoryFile(
            repository,
            'src/styles/styles-manifest.json',
            JSON.stringify(bootstrapped),
        );

        expect(
            checkReleasedPublicStylesCompatibility({
                currentManifest: bootstrapped,
                projectRoot: repository,
            }),
        ).toContain('v1.0.0 stable token --rp-color-text was removed or renamed');
    });
});

function createTaggedRepository(files: Record<string, string>) {
    const repository = mkdtempSync(join(tmpdir(), 'ropav-public-styles-'));
    temporaryRepositories.push(repository);

    runGit(repository, ['init', '--quiet']);
    runGit(repository, ['config', 'user.email', 'test@example.com']);
    runGit(repository, ['config', 'user.name', 'Test']);
    for (const [path, contents] of Object.entries(files)) {
        writeRepositoryFile(repository, path, contents);
    }
    runGit(repository, ['add', '.']);
    runGit(repository, ['commit', '--quiet', '-m', 'test: release baseline']);
    runGit(repository, ['tag', 'v1.0.0']);

    return repository;
}

function writeRepositoryFile(repository: string, path: string, contents: string) {
    const absolutePath = join(repository, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents);
}

function runGit(repository: string, arguments_: string[]) {
    execFileSync('git', arguments_, { cwd: repository, stdio: 'ignore' });
}
