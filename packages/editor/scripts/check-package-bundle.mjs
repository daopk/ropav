import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));

const targets = [
    manifest.exports['.'].import,
    manifest.exports['.'].types,
    manifest.exports['./editor.css'],
];
for (const target of targets) {
    const outputFile = resolve(packageRoot, target);
    if (!existsSync(outputFile)) throw new Error(`Missing package output: ${target}`);
}

const javascript = readFileSync(resolve(packageRoot, manifest.exports['.'].import), 'utf8');
for (const dependency of ['@tiptap/core', '@tiptap/starter-kit', 'vue']) {
    if (!javascript.includes(`from "${dependency}"`)) {
        throw new Error(`Built package must preserve an external import for ${dependency}`);
    }
}
for (const forbidden of ['@tiptap/vue-3', 'createVNode', 'defineComponent']) {
    if (javascript.includes(forbidden)) {
        throw new Error(`Built package includes forbidden VDOM marker: ${forbidden}`);
    }
}

const css = readFileSync(resolve(packageRoot, manifest.exports['./editor.css']), 'utf8');
if (!css.includes('.rp-editor')) throw new Error('Built stylesheet is missing .rp-editor');

console.log('Built editor package policies are satisfied.');
