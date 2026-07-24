import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import * as publicStylesContract from '../../scripts/public-styles-contract.mjs';
import * as publicStylesGitBaseline from '../../scripts/public-styles-git-baseline.mjs';

const { buildPublicStylesArtifacts, verifyPublicStylesContract } = publicStylesContract;
const { resolveReleasedPublicStylesBaseline } = publicStylesGitBaseline;

const temporaryRepositories: string[] = [];

afterEach(() => {
    for (const repository of temporaryRepositories.splice(0)) {
        rmSync(repository, { recursive: true, force: true });
    }
});

describe('public styles contract', () => {
    it('builds the manifest and documentation from one contract definition', () => {
        const { manifest, manifestJson, documentation } = buildPublicStylesArtifacts({
            tokens: [token('spacing.internal'), publicToken('spacing.stable')],
            darkTokenPaths: new Set(['spacing.stable']),
        });

        expect(manifest).toMatchObject({
            schemaVersion: 2,
            contractVersion: 2,
        });
        expect(manifest).not.toHaveProperty('baseline');
        expect(manifest.tokens).toContainEqual(
            expect.objectContaining({
                name: '--rp-spacing-stable',
                sourcePath: 'spacing.stable',
                themeApplicability: 'light-and-dark',
            }),
        );
        expect(manifest.tokens).not.toContainEqual(
            expect.objectContaining({ name: '--rp-spacing-internal' }),
        );
        expect(JSON.parse(manifestJson)).toEqual(manifest);
        expect(documentation).toContain('`--rp-spacing-stable`');
    });

    it('verifies a generated contract through the shared interface', () => {
        expect(verifyPublicStylesContract(createVerificationFixture())).toEqual([]);
    });

    it('rejects public tokens that are missing from the current manifest', () => {
        const fixture = createVerificationFixture();
        fixture.tokens.push(publicToken('spacing.unmanifested'));

        expect(verifyPublicStylesContract(fixture)).toContain(
            'generated token --rp-spacing-unmanifested is missing from the current manifest',
        );
    });

    it('rejects manifest tokens that have no public source', () => {
        const fixture = createVerificationFixture();
        fixture.currentManifest.tokens.push({
            ...fixture.currentManifest.tokens[0],
            name: '--rp-spacing-unexpected',
            sourcePath: 'spacing.unexpected',
        });

        expect(verifyPublicStylesContract(fixture)).toContain(
            'current manifest contains unexpected token --rp-spacing-unexpected',
        );
    });

    it('rejects duplicate component variables in the current manifest', () => {
        const fixture = createVerificationFixture();
        fixture.currentManifest.componentVariables.push({
            ...fixture.currentManifest.componentVariables[0],
        });

        expect(verifyPublicStylesContract(fixture)).toContain(
            'current manifest contains duplicate component variable --rp-switch-track-width',
        );
    });

    it('accepts documentation-only manifest changes', () => {
        const fixture = createVerificationFixture({
            currentTokens: [
                {
                    ...publicToken('spacing.stable'),
                    $description: 'Updated documentation.',
                },
            ],
        });

        expect(verifyPublicStylesContract(fixture)).toEqual([]);
    });

    it('blocks removing or renaming a released stable token', () => {
        const fixture = createVerificationFixture();
        fixture.currentManifest = {
            ...fixture.currentManifest,
            tokens: fixture.currentManifest.tokens.filter(
                ({ name }: { name: string }) => name !== '--rp-spacing-stable',
            ),
        };

        expect(verifyPublicStylesContract(fixture)).toContain(
            'v1.0.0 stable token --rp-spacing-stable was removed or renamed',
        );
    });

    it.each([
        ['sourcePath', 'spacing.changed'],
        ['type', 'string'],
        ['category', 'layout'],
        ['themeApplicability', 'all-themes'],
    ])('blocks changing token %s semantics', (field, value) => {
        const fixture = createVerificationFixture();
        fixture.currentManifest = {
            ...fixture.currentManifest,
            tokens: fixture.currentManifest.tokens.map((entry: Record<string, unknown>) =>
                entry.name === '--rp-spacing-stable' ? { ...entry, [field]: value } : entry,
            ),
        };

        expect(verifyPublicStylesContract(fixture).join('\n')).toContain(
            `stable token --rp-spacing-stable changed ${field}`,
        );
    });

    it('blocks changing component-variable semantics', () => {
        const fixture = createVerificationFixture();
        fixture.currentManifest = {
            ...fixture.currentManifest,
            componentVariables: fixture.currentManifest.componentVariables.map(
                (entry, index: number) =>
                    index === 0 ? { ...entry, acceptedValue: '<percentage>' } : entry,
            ),
        };

        expect(verifyPublicStylesContract(fixture).join('\n')).toContain(
            'stable component variable --rp-switch-track-width changed acceptedValue',
        );
    });

    it('requires a contract version increase for additions', () => {
        const fixture = createVerificationFixture({
            currentTokens: [publicToken('spacing.stable'), publicToken('spacing.added')],
            currentVersion: 1,
            releasedVersion: 1,
        });

        expect(verifyPublicStylesContract(fixture).join('\n')).toContain(
            'contractVersion must increase above 1 when adding token --rp-spacing-added',
        );
    });

    it('accepts additions with a newer contract version', () => {
        const fixture = createVerificationFixture({
            currentTokens: [publicToken('spacing.stable'), publicToken('spacing.added')],
            currentVersion: 2,
            releasedVersion: 1,
        });

        expect(verifyPublicStylesContract(fixture)).toEqual([]);
    });

    it('verifies generated CSS and source usage behind the same interface', () => {
        const fixture = createVerificationFixture();
        fixture.generatedCss = '';
        fixture.componentSources.push({
            path: 'src/components/example.vue',
            contents: 'var(--rp-slider-not-public)',
        });
        fixture.consumerSources.push({
            path: 'docs/example.md',
            contents: 'var(--_rp-private); .rp-internal {}',
        });

        const failures = verifyPublicStylesContract(fixture);
        expect(failures).toContain('manifest token --rp-spacing-stable is not generated');
        expect(failures).toContain(
            'component source uses non-allowlisted public geometry variable --rp-slider-not-public',
        );
        expect(failures).toContain('docs/example.md documents or consumes a private variable');
        expect(failures).toContain('docs/example.md consumes an internal Ropav class selector');
    });

    it('accepts a released baseline supplied by the Git adapter', () => {
        const fixture = createVerificationFixture();
        const repository = createRepository({
            'src/styles/styles-manifest.json': JSON.stringify(fixture.releasedBaseline.manifest),
        });

        const releasedBaseline = resolveReleasedPublicStylesBaseline({
            projectRoot: repository,
            baselineRef: '',
        });
        fixture.currentManifest = {
            ...fixture.currentManifest,
            tokens: fixture.currentManifest.tokens.filter(
                ({ name }: { name: string }) => name !== '--rp-spacing-stable',
            ),
        };

        expect(verifyPublicStylesContract({ ...fixture, releasedBaseline })).toContain(
            'v1.0.0 stable token --rp-spacing-stable was removed or renamed',
        );
    });

    it('requires a release tag or an explicit baseline ref', () => {
        const fixture = createVerificationFixture();
        const repository = createRepository(
            {
                'src/styles/styles-manifest.json': JSON.stringify(
                    fixture.releasedBaseline.manifest,
                ),
            },
            { tagRelease: false },
        );

        expect(
            resolveReleasedPublicStylesBaseline({
                projectRoot: repository,
                baselineRef: '',
            }),
        ).toEqual({
            failure:
                'cannot resolve a released public styles baseline containing src/styles/styles-manifest.json; fetch release tags or set PUBLIC_STYLES_BASELINE_REF',
        });
    });
});

function createVerificationFixture({
    currentTokens = [publicToken('spacing.stable')],
    releasedTokens = [publicToken('spacing.stable')],
    currentVersion = 2,
    releasedVersion,
}: {
    currentTokens?: ReturnType<typeof publicToken>[];
    releasedTokens?: ReturnType<typeof publicToken>[];
    currentVersion?: number;
    releasedVersion?: number;
} = {}) {
    const currentArtifacts = buildPublicStylesArtifacts({
        tokens: currentTokens,
        darkTokenPaths: new Set(['spacing.stable']),
    });
    const releasedArtifacts = buildPublicStylesArtifacts({
        tokens: releasedTokens,
        darkTokenPaths: new Set(['spacing.stable']),
    });
    const currentManifest = {
        ...currentArtifacts.manifest,
        contractVersion: currentVersion,
    };
    const releasedManifest = {
        ...releasedArtifacts.manifest,
        contractVersion: releasedVersion ?? currentVersion,
    };

    return {
        tokens: currentTokens,
        darkTokenPaths: new Set(['spacing.stable']),
        currentManifest,
        releasedBaseline: {
            ref: 'v1.0.0',
            manifest: releasedManifest,
        },
        generatedCss: renderGeneratedCss(currentManifest),
        documentation: currentArtifacts.documentation,
        componentSources: [
            {
                path: 'src/components/fixture.vue',
                contents: currentManifest.componentVariables
                    .map(({ name }: { name: string }) => `var(${name})`)
                    .join('\n'),
            },
        ],
        consumerSources: [] as Array<{ path: string; contents: string }>,
    };
}

function token(path: string, ropav: Record<string, unknown> = {}) {
    return {
        key: `{${path}}`,
        $type: path.startsWith('color.') ? 'color' : 'dimension',
        $description: `Public Ropav token for ${path}.`,
        $extensions: { ropav },
    };
}

function publicToken(path: string) {
    return token(path, { public: true });
}

function renderGeneratedCss(manifest: { tokens: Array<{ name: string }> }) {
    return `:root {\n${manifest.tokens.map(({ name }) => `  ${name}: #000;`).join('\n')}\n}\n`;
}

function createRepository(
    files: Record<string, string>,
    { tagRelease = true }: { tagRelease?: boolean } = {},
) {
    const repository = mkdtempSync(join(tmpdir(), 'ropav-public-styles-'));
    temporaryRepositories.push(repository);

    runGit(repository, ['init', '--quiet']);
    runGit(repository, ['config', 'user.email', 'test@example.com']);
    runGit(repository, ['config', 'user.name', 'Test']);
    for (const [path, contents] of Object.entries(files)) {
        const absolutePath = join(repository, path);
        mkdirSync(dirname(absolutePath), { recursive: true });
        writeFileSync(absolutePath, contents);
    }
    runGit(repository, ['add', '.']);
    runGit(repository, ['commit', '--quiet', '-m', 'test: release baseline']);
    if (tagRelease) runGit(repository, ['tag', 'v1.0.0']);

    return repository;
}

function runGit(repository: string, arguments_: string[]) {
    execFileSync('git', arguments_, { cwd: repository, stdio: 'ignore' });
}
