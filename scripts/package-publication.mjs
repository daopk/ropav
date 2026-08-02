import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { packagePublicationManifest } from './package-publication-manifest.mjs';

/**
 * @typedef {'generated-artifact-stale' | 'package-target-missing' | 'runtime-export-mismatch'} PackagePublicationIssueCode
 * @typedef {{
 *   code: PackagePublicationIssueCode;
 *   target: string;
 *   message: string;
 *   hint?: string;
 * }} PackagePublicationIssue
 */

/**
 * @param {string} projectRoot
 * @returns {Record<string, string>}
 */
export function createPackagePublicationBuildEntries(projectRoot) {
    validatePublicationProject(projectRoot);
    return createBuildEntries(projectRoot);
}

/**
 * @param {string} projectRoot
 * @param {{ mode: 'check' | 'write' }} options
 * @returns {{ issues: PackagePublicationIssue[]; writtenFiles: string[] }}
 */
export function synchronizePackagePublication(projectRoot, { mode }) {
    if (mode !== 'check' && mode !== 'write') {
        throw new Error(`Unsupported package publication synchronization mode: ${mode}`);
    }

    validatePublicationProject(projectRoot);

    const state = readPublicationState(projectRoot);
    const issues = getGeneratedArtifactIssues(state);
    if (mode === 'check') return { issues, writtenFiles: [] };

    const expectedIndex = renderRootIndex();
    const expectedPackageJson = createExpectedPackageJson(state.packageJson);
    const writtenFiles = [];

    if (state.indexSource !== expectedIndex) {
        writeFileSync(state.indexPath, expectedIndex);
        writtenFiles.push(packagePublicationManifest.root.source);
    }
    if (!isPackageJsonSynchronized(state.packageJson)) {
        writeFileSync(state.packagePath, `${JSON.stringify(expectedPackageJson, null, 2)}\n`);
        writtenFiles.push('package.json');
    }

    return { issues: [], writtenFiles };
}

/**
 * @param {string} projectRoot
 * @returns {Promise<{ issues: PackagePublicationIssue[] }>}
 */
export async function verifyBuiltPackagePublication(projectRoot) {
    validatePublicationProject(projectRoot);

    const state = readPublicationState(projectRoot);
    const issues = getGeneratedArtifactIssues(state);
    const packageTargets = new Set([
        state.packageJson.main,
        state.packageJson.module,
        state.packageJson.types,
        ...collectStringValues(state.packageJson.exports),
        ...createRuntimeEntries().map(({ import: importTarget }) => importTarget),
    ]);
    const missingTargets = new Set();

    for (const target of packageTargets) {
        if (typeof target !== 'string' || packageTargetExists(projectRoot, target)) continue;
        missingTargets.add(target);
        issues.push({
            code: 'package-target-missing',
            target,
            message: target.includes('*')
                ? `Package target pattern has no matches: ${target}`
                : `Package target does not exist: ${target}`,
        });
    }

    const runtimeEntries = createRuntimeEntries().filter(
        ({ import: importTarget }) => !missingTargets.has(importTarget),
    );
    if (runtimeEntries.length === 0) return { issues };

    issues.push(...(await getRuntimeExportIssues(projectRoot, runtimeEntries)));
    return { issues };
}

function validatePublicationProject(projectRoot) {
    validatePackagePublicationManifest();
    assertSourceInventory(projectRoot);
}

function validatePackagePublicationManifest(manifest = packagePublicationManifest) {
    if (manifest.schemaVersion !== 1) {
        throw new Error(
            `Unsupported package publication manifest schema: ${manifest.schemaVersion}`,
        );
    }

    const componentNames = manifest.components.map(({ name }) => name);
    assertSortedUnique(componentNames, 'published component names');

    for (const component of manifest.components) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(component.name)) {
            throw new Error(`Invalid published component name: ${component.name}`);
        }
        assertSortedUnique(component.runtimeExports, `${component.name} published runtime exports`);
    }

    const specialSubpaths = manifest.specialEntries.map(({ subpath }) => subpath);
    assertSortedUnique(specialSubpaths, 'special package publication subpaths');
    for (const entry of manifest.specialEntries) {
        assertSortedUnique(entry.runtimeExports, `${entry.subpath} published runtime exports`);
        if (entry.includeInRoot && !entry.rootSource) {
            throw new Error(`${entry.subpath} requires rootSource when includeInRoot is true`);
        }
    }

    for (const typeReexport of manifest.root.typeReexports) {
        assertSortedUnique(typeReexport.names, `${typeReexport.source} published type reexports`);
    }

    const packageSubpaths = [
        '.',
        ...specialSubpaths,
        ...componentNames.map((name) => `./${name}`),
        ...manifest.assetEntries.map(({ subpath }) => subpath),
    ];
    assertUnique(packageSubpaths, 'package publication subpaths');

    const rootExportOwners = new Map();
    const rootEntries = [
        ...manifest.specialEntries.filter(({ includeInRoot }) => includeInRoot),
        ...manifest.components,
    ];
    for (const entry of rootEntries) {
        const owner = entry.subpath ?? `./${entry.name}`;
        for (const name of entry.runtimeExports) {
            const previousOwner = rootExportOwners.get(name);
            if (previousOwner) {
                throw new Error(
                    `Root runtime export ${name} is declared by both ${previousOwner} and ${owner}`,
                );
            }
            rootExportOwners.set(name, owner);
        }
    }
}

function assertSourceInventory(projectRoot, manifest = packagePublicationManifest) {
    const componentsRoot = resolve(projectRoot, 'src/components');
    const actualNames = readdirSync(componentsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map(({ name }) => name);
    const expectedNames = manifest.components.map(({ name }) => name);
    assertExactNames(actualNames, expectedNames, 'Package publication source inventory');

    for (const entry of createRuntimeEntries(manifest)) {
        if (!existsSync(resolve(projectRoot, entry.source))) {
            throw new Error(`${entry.subpath} source entry does not exist: ${entry.source}`);
        }
    }
    for (const entry of manifest.assetEntries) {
        if (entry.buildName && entry.source && !existsSync(resolve(projectRoot, entry.source))) {
            throw new Error(`${entry.subpath} source entry does not exist: ${entry.source}`);
        }
    }
}

function getExpectedRootRuntimeExports(manifest = packagePublicationManifest) {
    return [
        ...manifest.specialEntries
            .filter(({ includeInRoot }) => includeInRoot)
            .flatMap(({ runtimeExports }) => runtimeExports),
        ...manifest.components.flatMap(({ runtimeExports }) => runtimeExports),
    ].toSorted();
}

function createExpectedPackageExports(manifest = packagePublicationManifest) {
    const exports = {
        '.': {
            types: manifest.root.types,
            import: manifest.root.import,
        },
    };

    for (const entry of manifest.specialEntries.filter(({ includeInRoot }) => includeInRoot)) {
        exports[entry.subpath] = {
            types: entry.types,
            import: entry.import,
        };
    }
    for (const { name } of manifest.components) {
        exports[`./${name}`] = {
            types: `./dist/components/${name}/index.d.ts`,
            import: `./dist/components/${name}/index.js`,
        };
    }
    for (const entry of manifest.specialEntries.filter(({ includeInRoot }) => !includeInRoot)) {
        exports[entry.subpath] = {
            types: entry.types,
            import: entry.import,
        };
    }
    for (const { subpath, target } of manifest.assetEntries) exports[subpath] = target;

    return exports;
}

function createExpectedPackageJson(packageJson, manifest = packagePublicationManifest) {
    return {
        ...packageJson,
        main: manifest.root.import,
        module: manifest.root.import,
        types: manifest.root.types,
        exports: createExpectedPackageExports(manifest),
    };
}

function createRuntimeEntries(manifest = packagePublicationManifest) {
    const root = {
        subpath: '.',
        source: manifest.root.source,
        import: manifest.root.import,
        runtimeExports: getExpectedRootRuntimeExports(manifest),
    };
    const components = manifest.components.map(({ name, runtimeExports }) => ({
        subpath: `./${name}`,
        source: `src/components/${name}/index.ts`,
        import: `./dist/components/${name}/index.js`,
        runtimeExports,
    }));

    return [
        root,
        ...manifest.specialEntries.filter(({ includeInRoot }) => includeInRoot),
        ...components,
        ...manifest.specialEntries.filter(({ includeInRoot }) => !includeInRoot),
    ];
}

function createBuildEntries(projectRoot, manifest = packagePublicationManifest) {
    const entries = {
        [manifest.root.buildName]: resolve(projectRoot, manifest.root.source),
    };

    for (const entry of manifest.assetEntries) {
        if (entry.buildName && entry.source) {
            entries[entry.buildName] = resolve(projectRoot, entry.source);
        }
    }
    for (const entry of manifest.specialEntries) {
        entries[entry.buildName] = resolve(projectRoot, entry.source);
    }
    for (const { name } of manifest.components) {
        entries[`components/${name}/index`] = resolve(
            projectRoot,
            `src/components/${name}/index.ts`,
        );
    }

    return entries;
}

function renderRootIndex(manifest = packagePublicationManifest) {
    const lines = [
        '// This file is generated by scripts/sync-package-publication.mjs.',
        '// Run `pnpm publication:sync` after editing scripts/package-publication-manifest.mjs.',
        '',
    ];

    for (const { names, source } of manifest.root.typeReexports) {
        lines.push(`export type { ${names.join(', ')} } from '${source}';`);
    }
    for (const { includeInRoot, rootSource } of manifest.specialEntries) {
        if (includeInRoot) lines.push(`export * from '${rootSource}';`);
    }
    for (const { name } of manifest.components) {
        lines.push(`export * from './components/${name}';`);
    }

    return `${lines.join('\n')}\n`;
}

function readPublicationState(projectRoot) {
    const indexPath = resolve(projectRoot, packagePublicationManifest.root.source);
    const packagePath = resolve(projectRoot, 'package.json');
    return {
        indexPath,
        indexSource: readFileSync(indexPath, 'utf8'),
        packagePath,
        packageJson: JSON.parse(readFileSync(packagePath, 'utf8')),
    };
}

/**
 * @param {{ indexSource: string; packageJson: Record<string, unknown> }} state
 * @returns {PackagePublicationIssue[]}
 */
function getGeneratedArtifactIssues({ indexSource, packageJson }) {
    const hint = 'Run `pnpm publication:sync` to update generated publication files.';
    const issues = [];
    if (indexSource !== renderRootIndex()) {
        issues.push({
            code: 'generated-artifact-stale',
            target: packagePublicationManifest.root.source,
            message: `${packagePublicationManifest.root.source} differs from the package publication manifest`,
            hint,
        });
    }

    for (const field of ['main', 'module', 'types']) {
        const expected =
            field === 'types'
                ? packagePublicationManifest.root.types
                : packagePublicationManifest.root.import;
        if (packageJson[field] !== expected) {
            issues.push({
                code: 'generated-artifact-stale',
                target: `package.json#${field}`,
                message: `package.json#${field} differs from the package publication manifest`,
                hint,
            });
        }
    }

    issues.push(
        ...getPackageExportIssues(packageJson.exports, createExpectedPackageExports(), hint),
    );
    return issues;
}

function getPackageExportIssues(actual, expected, hint) {
    if (!actual || typeof actual !== 'object') {
        return [
            {
                code: 'generated-artifact-stale',
                target: 'package.json#exports',
                message: 'package.json#exports is missing or is not an object',
                hint,
            },
        ];
    }

    const issues = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    const { missing, unexpected } = getExactNameDiff(actualKeys, expectedKeys);
    if (missing.length > 0) {
        issues.push({
            code: 'generated-artifact-stale',
            target: 'package.json#exports',
            message: `package.json#exports is missing ${missing.join(', ')}`,
            hint,
        });
    }
    if (unexpected.length > 0) {
        issues.push({
            code: 'generated-artifact-stale',
            target: 'package.json#exports',
            message: `package.json#exports has unexpected ${unexpected.join(', ')}`,
            hint,
        });
    }

    for (const subpath of expectedKeys.filter((key) => Object.hasOwn(actual, key))) {
        if (!isDeepStrictEqual(actual[subpath], expected[subpath])) {
            issues.push({
                code: 'generated-artifact-stale',
                target: `package.json#exports[${JSON.stringify(subpath)}]`,
                message: `package.json#exports[${JSON.stringify(subpath)}] differs from the package publication manifest`,
                hint,
            });
        }
    }
    return issues;
}

function isPackageJsonSynchronized(packageJson) {
    const expected = createExpectedPackageJson(packageJson);
    return (
        packageJson.main === expected.main &&
        packageJson.module === expected.module &&
        packageJson.types === expected.types &&
        isDeepStrictEqual(packageJson.exports, expected.exports)
    );
}

function collectStringValues(value) {
    if (typeof value === 'string') return [value];
    if (!value || typeof value !== 'object') return [];
    return Object.values(value).flatMap(collectStringValues);
}

function packageTargetExists(projectRoot, target) {
    const normalizedTarget = normalizePackageTarget(target);
    if (!normalizedTarget.includes('*')) return existsSync(resolve(projectRoot, normalizedTarget));

    const targetDirectory = dirname(normalizedTarget);
    const targetPattern = new RegExp(
        `^${escapeRegExp(basename(normalizedTarget)).replaceAll('\\*', '.+')}$`,
    );
    const absoluteDirectory = resolve(projectRoot, targetDirectory);
    return (
        existsSync(absoluteDirectory) &&
        readdirSync(absoluteDirectory).some((entry) => targetPattern.test(entry))
    );
}

async function getRuntimeExportIssues(projectRoot, runtimeEntries) {
    const [{ JSDOM }, { createServer }] = await Promise.all([import('jsdom'), import('vite')]);
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    const restoreGlobals = installDomGlobals(dom.window);
    let server;

    try {
        server = await createServer({
            root: projectRoot,
            logLevel: 'silent',
            resolve: {
                alias: {
                    vue: resolve(
                        projectRoot,
                        'node_modules/vue/dist/vue.runtime-with-vapor.esm-browser.prod.js',
                    ),
                },
            },
            server: { middlewareMode: true },
        });

        const issueGroups = await Promise.all(
            runtimeEntries.map(async (entry) => {
                const buildPath = normalizePackageTarget(entry.import);
                const [sourceModule, buildModule] = await Promise.all([
                    server.ssrLoadModule(`/${entry.source}`),
                    server.ssrLoadModule(`/${buildPath}`),
                ]);
                return compareRuntimeExports(entry, sourceModule, buildModule);
            }),
        );
        return issueGroups.flat();
    } finally {
        if (server) await server.close();
        restoreGlobals();
        dom.window.close();
    }
}

function installDomGlobals(window) {
    const globals = {
        window,
        document: window.document,
        Element: window.Element,
        HTMLElement: window.HTMLElement,
        Node: window.Node,
        SVGElement: window.SVGElement,
    };
    const previousDescriptors = new Map();

    for (const [name, value] of Object.entries(globals)) {
        previousDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
        Object.defineProperty(globalThis, name, {
            configurable: true,
            writable: true,
            value,
        });
    }

    return () => {
        for (const [name, descriptor] of previousDescriptors) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete globalThis[name];
        }
    };
}

function compareRuntimeExports(entry, sourceModule, buildModule) {
    const issues = [];
    const sourceNames = Object.keys(sourceModule);
    const expectedDiff = getExactNameDiff(sourceNames, entry.runtimeExports);
    if (expectedDiff.missing.length > 0 || expectedDiff.unexpected.length > 0) {
        issues.push({
            code: 'runtime-export-mismatch',
            target: entry.subpath,
            message: `${entry.subpath} source runtime exports differ from the package publication manifest: ${formatNameDiff(expectedDiff)}`,
        });
    }

    const buildDiff = getExactNameDiff(Object.keys(buildModule), sourceNames);
    if (buildDiff.missing.length > 0 || buildDiff.unexpected.length > 0) {
        issues.push({
            code: 'runtime-export-mismatch',
            target: entry.subpath,
            message: `${entry.subpath} built runtime exports differ from its source entry: ${formatNameDiff(buildDiff)}`,
        });
    }
    return issues;
}

function assertExactNames(actualNames, expectedNames, label) {
    const diff = getExactNameDiff(actualNames, expectedNames);
    if (diff.missing.length === 0 && diff.unexpected.length === 0) return;
    throw new Error(`${label} differs: ${formatNameDiff(diff)}`);
}

function getExactNameDiff(actualNames, expectedNames) {
    const actual = new Set(actualNames);
    const expected = new Set(expectedNames);
    return {
        missing: [...expected].filter((name) => !actual.has(name)).toSorted(),
        unexpected: [...actual].filter((name) => !expected.has(name)).toSorted(),
    };
}

function formatNameDiff({ missing, unexpected }) {
    return [
        missing.length > 0 ? `missing ${missing.join(', ')}` : undefined,
        unexpected.length > 0 ? `unexpected ${unexpected.join(', ')}` : undefined,
    ]
        .filter(Boolean)
        .join('; ');
}

function normalizePackageTarget(target) {
    return target.replace(/^\.\//, '');
}

function assertSortedUnique(values, label) {
    assertUnique(values, label);
    const sorted = values.toSorted();
    if (!isDeepStrictEqual(values, sorted)) {
        throw new Error(`${label} must be sorted`);
    }
}

function assertUnique(values, label) {
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    if (duplicates.length > 0) {
        throw new Error(`${label} contains duplicates: ${[...new Set(duplicates)].join(', ')}`);
    }
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
