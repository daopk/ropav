import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyBuiltClientOnlyPackage } from '../../../scripts/verify-built-client-only-package.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await verifyBuiltClientOnlyPackage({
    packageRoot,
    policy: {
        nodeClientMarkers: ['@tanstack/', 'ropav/composables', 'from "vue"', "from 'vue'"],
        assertNodeInterface,
        invokeServerRender(module) {
            return module.Table.setup();
        },
        verifyPackageOutput,
    },
});

console.log('Built table package policies are satisfied.');

function assertNodeInterface(module, entryName) {
    if (!Array.isArray(module.tableParts) || typeof module.Table?.setup !== 'function') {
        throw new Error(`${entryName} does not expose the table package interface`);
    }
}

function verifyPackageOutput({ clientJavaScript, readExport }) {
    for (const dependency of ['@tanstack/table-core', 'ropav/composables', 'vue']) {
        if (!clientJavaScript.includes(`from "${dependency}"`)) {
            throw new Error(`Built package must preserve an external import for ${dependency}`);
        }
    }
    for (const forbidden of ['@tanstack/vue-table']) {
        if (clientJavaScript.includes(forbidden)) {
            throw new Error(`Built package includes forbidden VDOM marker: ${forbidden}`);
        }
    }

    const css = readExport('./table.css');
    if (!css.includes('.rp-table')) throw new Error('Built stylesheet is missing .rp-table');
    if (!css.includes('.rp-table__sort-button')) {
        throw new Error('Built stylesheet is missing .rp-table__sort-button');
    }
    if (!css.includes('@layer ropav.components')) {
        throw new Error('Built stylesheet is missing the ropav.components cascade layer');
    }
    if (!css.includes('@media (forced-colors: active)')) {
        throw new Error('Built stylesheet is missing forced-colors support');
    }
}
