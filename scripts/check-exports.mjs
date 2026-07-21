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

const baseCss = readFileSync(join(projectRoot, 'dist/base.css'), 'utf8');
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
