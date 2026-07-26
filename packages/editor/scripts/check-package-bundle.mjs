import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));

const targets = new Set([
    manifest.main,
    manifest.browser,
    manifest.exports['.'].import,
    manifest.exports['.'].browser,
    manifest.exports['.'].node,
    manifest.exports['.'].types,
    manifest.exports['./editor.css'],
]);
for (const target of targets) {
    const outputFile = resolve(packageRoot, target);
    if (!existsSync(outputFile)) throw new Error(`Missing package output: ${target}`);
}

const javascript = readFileSync(resolve(packageRoot, manifest.exports['.'].import), 'utf8');
for (const dependency of ['@tiptap/core', '@tiptap/pm/state', '@tiptap/starter-kit', 'vue']) {
    if (!javascript.includes(`from "${dependency}"`)) {
        throw new Error(`Built package must preserve an external import for ${dependency}`);
    }
}
for (const forbidden of ['@tiptap/vue-3', 'createVNode', 'defineComponent']) {
    if (javascript.includes(forbidden)) {
        throw new Error(`Built package includes forbidden VDOM marker: ${forbidden}`);
    }
}

const nodeEntry = resolve(packageRoot, manifest.exports['.'].node);
const nodeClosure = readJavaScriptClosure(nodeEntry);
for (const [file, source] of nodeClosure) {
    for (const forbidden of [
        '@tiptap/',
        'from "vue"',
        "from 'vue'",
        'createVNode',
        'defineComponent',
    ]) {
        if (source.includes(forbidden)) {
            throw new Error(`${file} includes client-only marker: ${forbidden}`);
        }
    }
}

const resolvedNodeEntry = fileURLToPath(import.meta.resolve(manifest.name));
if (resolvedNodeEntry !== nodeEntry) {
    throw new Error(`Node self-resolution selected ${resolvedNodeEntry} instead of ${nodeEntry}`);
}

const nodeModule = await import(manifest.name);
assertNodeApi(nodeModule, 'Node export condition');

const legacyRequire = createRequire(import.meta.url);
const resolvedMainEntry = legacyRequire.resolve(packageRoot);
if (resolvedMainEntry !== nodeEntry) {
    throw new Error(`Legacy main selected ${resolvedMainEntry} instead of ${nodeEntry}`);
}
assertNodeApi(legacyRequire(packageRoot), 'Legacy main');

try {
    nodeModule.Editor.setup();
    throw new Error('Node Editor guard did not reject server rendering');
} catch (error) {
    if (!(error instanceof Error) || !error.message.includes('client-only')) throw error;
}

const css = readFileSync(resolve(packageRoot, manifest.exports['./editor.css']), 'utf8');
if (!css.includes('.rp-editor')) throw new Error('Built stylesheet is missing .rp-editor');
const componentLayer = readCssBlock(css, '@layer ropav.components');
if (!componentLayer.includes('.ProseMirror-gapcursor')) {
    throw new Error('Built stylesheet is missing layered ProseMirror base rules');
}
const forcedColors = readCssBlock(componentLayer, '@media (forced-colors: active)');
if (
    !forcedColors.includes('.tiptap:focus-visible') ||
    !forcedColors.includes('outline: 2px solid Highlight')
) {
    throw new Error('Built stylesheet is missing the forced-colors system outline');
}

console.log('Built editor package policies are satisfied.');

function assertNodeApi(module, entryName) {
    if (!Array.isArray(module.editorParts) || typeof module.Editor?.setup !== 'function') {
        throw new Error(`${entryName} does not expose the editor package API`);
    }
}

function readJavaScriptClosure(entry) {
    const modules = new Map();
    const pending = [entry];

    while (pending.length > 0) {
        const file = pending.pop();
        if (!file || modules.has(file)) continue;

        const source = readFileSync(file, 'utf8');
        modules.set(file, source);
        for (const specifier of readRelativeModuleSpecifiers(source)) {
            const dependency = resolve(dirname(file), specifier);
            if (!existsSync(dependency)) {
                throw new Error(`Missing Node entry dependency: ${dependency}`);
            }
            pending.push(dependency);
        }
    }

    return modules;
}

function readRelativeModuleSpecifiers(source) {
    const staticImports = source.matchAll(
        /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["'](\.[^"']+)["']/g,
    );
    const dynamicImports = source.matchAll(/\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g);
    return new Set(
        [...staticImports, ...dynamicImports]
            .map((match) => match[1])
            .filter((specifier) => specifier !== undefined),
    );
}

function readCssBlock(source, header) {
    const headerIndex = source.indexOf(header);
    if (headerIndex < 0) throw new Error(`Built stylesheet is missing ${header}`);

    const openingBrace = source.indexOf('{', headerIndex + header.length);
    if (openingBrace < 0) throw new Error(`Built stylesheet has an invalid ${header} block`);

    let depth = 1;
    for (let index = openingBrace + 1; index < source.length; index += 1) {
        const character = source[index];
        if (character === '{') depth += 1;
        if (character !== '}') continue;

        depth -= 1;
        if (depth === 0) return source.slice(openingBrace + 1, index);
    }

    throw new Error(`Built stylesheet has an unclosed ${header} block`);
}
