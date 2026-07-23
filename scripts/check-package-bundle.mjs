import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(fileURLToPath(import.meta.url), '../..');
const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
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

console.log('Built package bundle policies are satisfied.');

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

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
