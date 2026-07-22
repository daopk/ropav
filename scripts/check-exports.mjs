import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

import {
    assertComponentInventory,
    assertExactExports,
    createRuntimeEntries,
    getGeneratedArtifactIssues,
    publicApiManifest,
    validatePublicApiManifest,
} from './public-api.mjs';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

validatePublicApiManifest();
assertComponentInventory(projectRoot);

const generatedArtifactIssues = getGeneratedArtifactIssues({
    indexSource: readFileSync(join(projectRoot, publicApiManifest.root.source), 'utf8'),
    packageJson,
});
if (generatedArtifactIssues.length > 0) {
    throw new Error(
        `${generatedArtifactIssues.join('\n')}\nRun \`pnpm public-api:sync\` to update generated files.`,
    );
}

const packageTargets = new Set([
    packageJson.main,
    packageJson.module,
    packageJson.types,
    ...collectStringValues(packageJson.exports),
]);
for (const target of packageTargets) assertPackageTargetExists(target);

const distRoot = join(projectRoot, 'dist');
assertSharedButtonStyles(distRoot);
assertExternalRuntimeDependency(distRoot, '@floating-ui/dom');

const baseCss = readFileSync(join(distRoot, 'base.css'), 'utf8');
for (const selector of ['.rp-spinner', '@keyframes rp-spinner-spin']) {
    if (!baseCss.includes(selector)) {
        throw new Error(`dist/base.css does not include ${selector}`);
    }
}
for (const layer of [
    '@layer ropav.tokens, ropav.components',
    '@layer ropav.tokens',
    '@layer ropav.components',
]) {
    if (!baseCss.includes(layer)) throw new Error(`dist/base.css does not include ${layer}`);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.SVGElement = dom.window.SVGElement;

const server = await createServer({
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

try {
    await Promise.all(
        createRuntimeEntries().map(async (entry) => {
            const buildPath = normalizePackageTarget(entry.import);
            if (!existsSync(join(projectRoot, entry.source))) {
                throw new Error(`${entry.subpath} source entry does not exist: ${entry.source}`);
            }

            const [sourceModule, buildModule] = await Promise.all([
                server.ssrLoadModule(`/${entry.source}`),
                server.ssrLoadModule(`/${buildPath}`),
            ]);
            assertExactExports(sourceModule, entry.runtimeExports, entry.subpath);
            assertSameExports(sourceModule, buildModule, entry.subpath);
        }),
    );
} finally {
    await server.close();
}

function collectStringValues(value) {
    if (typeof value === 'string') return [value];
    if (!value || typeof value !== 'object') return [];

    return Object.values(value).flatMap(collectStringValues);
}

function assertPackageTargetExists(target) {
    if (typeof target !== 'string') return;

    const normalizedTarget = normalizePackageTarget(target);
    if (!normalizedTarget.includes('*')) {
        if (!existsSync(join(projectRoot, normalizedTarget))) {
            throw new Error(`Package target does not exist: ${target}`);
        }
        return;
    }

    const targetDirectory = dirname(normalizedTarget);
    const targetPattern = new RegExp(
        `^${escapeRegExp(basename(normalizedTarget)).replaceAll('\\*', '.+')}$`,
    );
    const absoluteDirectory = join(projectRoot, targetDirectory);
    if (
        !existsSync(absoluteDirectory) ||
        !readdirSync(absoluteDirectory).some((entry) => targetPattern.test(entry))
    ) {
        throw new Error(`Package target pattern has no matches: ${target}`);
    }
}

function assertSharedButtonStyles(outputRoot) {
    const buttonStyleMarker = /--_rp-button-bg:\s*var\(--rp-color-default\)/g;
    const cssFiles = readdirSync(outputRoot)
        .filter((file) => file.endsWith('.css'))
        .map((file) => join(outputRoot, file));
    const markerMatches = cssFiles.flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return [...source.matchAll(buttonStyleMarker)].map(() => file);
    });

    if (markerMatches.length !== 1) {
        throw new Error(
            `Expected one emitted button foundation stylesheet, found ${markerMatches.length}`,
        );
    }

    const sharedButtonCss = markerMatches[0];
    for (const component of ['button', 'button-link', 'icon-button']) {
        const target = packageJson.exports[`./${component}`]?.import;
        if (typeof target !== 'string') {
            throw new Error(`Missing package import target for ./${component}`);
        }

        const imports = collectRelativeImports(join(projectRoot, normalizePackageTarget(target)));
        if (!imports.has(sharedButtonCss)) {
            throw new Error(`./${component} does not import the shared button stylesheet`);
        }
    }
}

function assertExternalRuntimeDependency(outputRoot, dependency) {
    const externalImportPattern = new RegExp(`from\\s+['"]${escapeRegExp(dependency)}['"]`);
    const javascript = readdirSync(outputRoot)
        .filter((file) => file.endsWith('.js'))
        .map((file) => readFileSync(join(outputRoot, file), 'utf8'));

    if (!javascript.some((source) => externalImportPattern.test(source))) {
        throw new Error(`Built package does not preserve an external import for ${dependency}`);
    }
    if (javascript.some((source) => source.includes('#region node_modules/.pnpm/@floating-ui'))) {
        throw new Error(`${dependency} implementation is embedded in the built package`);
    }
}

function collectRelativeImports(entryFile) {
    const imports = new Set();
    const visited = new Set();
    const importPattern = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

    function visit(file) {
        if (visited.has(file)) return;
        visited.add(file);

        const source = readFileSync(file, 'utf8');
        for (const match of source.matchAll(importPattern)) {
            const specifier = match[1];
            if (!specifier.startsWith('.')) continue;

            const importedFile = resolve(dirname(file), specifier);
            imports.add(importedFile);
            if (importedFile.endsWith('.js')) visit(importedFile);
        }
    }

    visit(entryFile);
    return imports;
}

function normalizePackageTarget(target) {
    return target.replace(/^\.\//, '');
}

function assertSameExports(sourceModule, buildModule, label) {
    const sourceNames = Object.keys(sourceModule).toSorted();
    const buildNames = Object.keys(buildModule).toSorted();
    const missing = sourceNames.filter((name) => !Object.hasOwn(buildModule, name));
    const unexpected = buildNames.filter((name) => !Object.hasOwn(sourceModule, name));

    if (missing.length === 0 && unexpected.length === 0) return;

    const details = [
        missing.length > 0 ? `missing ${missing.join(', ')}` : undefined,
        unexpected.length > 0 ? `unexpected ${unexpected.join(', ')}` : undefined,
    ].filter(Boolean);
    throw new Error(`${label} runtime exports differ from its source entry: ${details.join('; ')}`);
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
