import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { publicApiManifest } from './public-api-manifest.mjs';

export { publicApiManifest } from './public-api-manifest.mjs';

export function validatePublicApiManifest(manifest = publicApiManifest) {
    if (manifest.schemaVersion !== 1) {
        throw new Error(`Unsupported public API manifest schema: ${manifest.schemaVersion}`);
    }

    const componentNames = manifest.components.map(({ name }) => name);
    assertSortedUnique(componentNames, 'public component names');

    for (const component of manifest.components) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(component.name)) {
            throw new Error(`Invalid public component name: ${component.name}`);
        }
        assertSortedUnique(component.runtimeExports, `${component.name} public runtime exports`);
    }

    const specialSubpaths = manifest.specialEntries.map(({ subpath }) => subpath);
    assertSortedUnique(specialSubpaths, 'special public API subpaths');
    for (const entry of manifest.specialEntries) {
        assertSortedUnique(entry.runtimeExports, `${entry.subpath} public runtime exports`);
        if (entry.includeInRoot && !entry.rootSource) {
            throw new Error(`${entry.subpath} requires rootSource when includeInRoot is true`);
        }
    }

    for (const typeReexport of manifest.root.typeReexports) {
        assertSortedUnique(typeReexport.names, `${typeReexport.source} public type reexports`);
    }

    const packageSubpaths = [
        '.',
        ...specialSubpaths,
        ...componentNames.map((name) => `./${name}`),
        ...manifest.assetEntries.map(({ subpath }) => subpath),
    ];
    assertUnique(packageSubpaths, 'package export subpaths');

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

export function getExpectedRootRuntimeExports(manifest = publicApiManifest) {
    return [
        ...manifest.specialEntries
            .filter(({ includeInRoot }) => includeInRoot)
            .flatMap(({ runtimeExports }) => runtimeExports),
        ...manifest.components.flatMap(({ runtimeExports }) => runtimeExports),
    ].toSorted();
}

/** @returns {Record<string, string | { types: string; import: string }>} */
export function createExpectedPackageExports(manifest = publicApiManifest) {
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

export function createRuntimeEntries(manifest = publicApiManifest) {
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

/** @returns {Record<string, string>} */
export function createLibraryEntries(projectRoot, manifest = publicApiManifest) {
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

export function renderRootIndex(manifest = publicApiManifest) {
    const lines = [
        '// This file is generated by scripts/sync-public-api.mjs.',
        '// Run `pnpm public-api:sync` after editing scripts/public-api-manifest.mjs.',
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

export function getGeneratedArtifactIssues(
    { indexSource, packageJson },
    manifest = publicApiManifest,
) {
    const issues = [];
    if (indexSource !== renderRootIndex(manifest)) {
        issues.push('src/index.ts is not synchronized with the public API manifest');
    }

    for (const field of ['main', 'module', 'types']) {
        const expected = field === 'types' ? manifest.root.types : manifest.root.import;
        if (packageJson[field] !== expected) {
            issues.push(`package.json#${field} differs from the public API manifest`);
        }
    }

    issues.push(
        ...getPackageExportIssues(packageJson.exports, createExpectedPackageExports(manifest)),
    );
    return issues;
}

export function getPackageExportIssues(actual, expected) {
    if (!actual || typeof actual !== 'object') {
        return ['package.json#exports is missing or is not an object'];
    }

    const issues = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    const { missing, unexpected } = getExactNameDiff(actualKeys, expectedKeys);
    if (missing.length > 0) {
        issues.push(`package.json#exports is missing ${missing.join(', ')}`);
    }
    if (unexpected.length > 0) {
        issues.push(`package.json#exports has unexpected ${unexpected.join(', ')}`);
    }

    for (const subpath of expectedKeys.filter((key) => Object.hasOwn(actual, key))) {
        if (!isDeepStrictEqual(actual[subpath], expected[subpath])) {
            issues.push(
                `package.json#exports[${JSON.stringify(subpath)}] differs from the manifest`,
            );
        }
    }
    return issues;
}

export function assertComponentInventory(projectRoot, manifest = publicApiManifest) {
    const componentsRoot = resolve(projectRoot, 'src/components');
    const actualNames = readdirSync(componentsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map(({ name }) => name);
    const expectedNames = manifest.components.map(({ name }) => name);
    assertExactNames(actualNames, expectedNames, 'Public component inventory');

    for (const name of expectedNames) {
        const indexPath = resolve(componentsRoot, name, 'index.ts');
        if (!existsSync(indexPath)) {
            throw new Error(`Public component ${name} is missing src/components/${name}/index.ts`);
        }
    }
}

export function assertExactExports(module, expectedNames, label) {
    assertExactNames(Object.keys(module), expectedNames, `${label} public runtime exports`);
}

export function assertExactNames(actualNames, expectedNames, label) {
    const { missing, unexpected } = getExactNameDiff(actualNames, expectedNames);
    if (missing.length === 0 && unexpected.length === 0) return;

    const details = [
        missing.length > 0 ? `missing ${missing.join(', ')}` : undefined,
        unexpected.length > 0 ? `unexpected ${unexpected.join(', ')}` : undefined,
    ].filter(Boolean);
    throw new Error(`${label} differs: ${details.join('; ')}`);
}

export function getExactNameDiff(actualNames, expectedNames) {
    const actual = new Set(actualNames);
    const expected = new Set(expectedNames);
    return {
        missing: [...expected].filter((name) => !actual.has(name)).toSorted(),
        unexpected: [...actual].filter((name) => !expected.has(name)).toSorted(),
    };
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
