import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyBuiltClientOnlyPackage } from '../../../scripts/verify-built-client-only-package.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await verifyBuiltClientOnlyPackage({
    packageRoot,
    policy: {
        nodeClientMarkers: ['@tiptap/', 'from "vue"', "from 'vue'"],
        assertNodeInterface,
        invokeServerRender(module) {
            return module.Editor.setup();
        },
        verifyPackageOutput,
    },
});

console.log('Built editor package policies are satisfied.');

function assertNodeInterface(module, entryName) {
    if (!Array.isArray(module.editorParts) || typeof module.Editor?.setup !== 'function') {
        throw new Error(`${entryName} does not expose the editor package API`);
    }
}

function verifyPackageOutput({ clientJavaScript, readExport }) {
    for (const dependency of ['@tiptap/core', '@tiptap/pm/state', '@tiptap/starter-kit', 'vue']) {
        if (!clientJavaScript.includes(`from "${dependency}"`)) {
            throw new Error(`Built package must preserve an external import for ${dependency}`);
        }
    }
    if (/\b(?:from\s+|import\s*\(\s*)["']~icons\//.test(clientJavaScript)) {
        throw new Error('Built package contains an unresolved icon module');
    }

    const css = readExport('./editor.css');
    if (!css.includes('.rp-editor')) throw new Error('Built stylesheet is missing .rp-editor');
    if (!css.includes('.rp-editor-toolbar')) {
        throw new Error('Built stylesheet is missing .rp-editor-toolbar');
    }
    const componentLayer = readCssBlocks(css, '@layer ropav.components').join('\n');
    if (!componentLayer.includes('.ProseMirror-gapcursor')) {
        throw new Error('Built stylesheet is missing layered ProseMirror base rules');
    }
    const forcedColors = readCssBlocks(componentLayer, '@media (forced-colors: active)').join('\n');
    if (
        !forcedColors.includes('.tiptap:focus-visible') ||
        !forcedColors.includes('outline: 2px solid Highlight')
    ) {
        throw new Error('Built stylesheet is missing the forced-colors system outline');
    }
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

function readCssBlocks(source, header) {
    const blocks = [];
    let remainingSource = source;

    while (remainingSource.includes(header)) {
        const headerIndex = remainingSource.indexOf(header);
        blocks.push(readCssBlock(remainingSource, header));
        remainingSource = remainingSource.slice(headerIndex + header.length);
    }

    if (blocks.length === 0) {
        throw new Error(`Built stylesheet is missing ${header}`);
    }
    return blocks;
}
