import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { verifyBuiltClientOnlyPackage } from '../scripts/verify-built-client-only-package.mjs';

const fixtureRoots = [];

afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe('built client-only package verification', () => {
    it('verifies nested conditional outputs, Node resolution, the interface, and the client-only guard', async () => {
        const packageRoot = createPackage();
        const checkedEntries = [];

        await verifyBuiltClientOnlyPackage({
            packageRoot,
            policy: createPolicy({
                assertNodeInterface(module, entryName) {
                    assert.deepEqual(module.widgetParts, []);
                    assert.equal(typeof module.Widget?.setup, 'function');
                    checkedEntries.push(entryName);
                },
                verifyPackageOutput({ clientJavaScript, readExport }) {
                    assert.match(clientJavaScript, /from "vue"/);
                    assert.match(readExport('./widget.css'), /\.rp-widget/);
                },
            }),
        });

        assert.deepEqual(checkedEntries, ['Node export condition', 'Legacy main']);
    });

    it('rejects a missing manifest output through the module interface', async () => {
        const packageRoot = createPackage();
        rmSync(join(packageRoot, 'dist', 'index.d.ts'));

        await assert.rejects(
            verifyBuiltClientOnlyPackage({ packageRoot, policy: createPolicy() }),
            /Missing package output: \.\/dist\/index\.d\.ts/,
        );
    });

    it('rejects client dependencies anywhere in the Node closure', async () => {
        const packageRoot = createPackage({
            'dist/node-api.js': [
                'import "vue";',
                'export const widgetParts = [];',
                'export const Widget = { setup() { throw new Error("client-only fixture"); } };',
            ].join('\n'),
        });

        await assert.rejects(
            verifyBuiltClientOnlyPackage({ packageRoot, policy: createPolicy() }),
            /node-api\.js includes client-only marker: "vue"/,
        );
    });

    it('rejects a conditional export whose ordering bypasses the Node entry', async () => {
        const packageRoot = createPackage({}, { importBeforeNode: true });

        await assert.rejects(
            verifyBuiltClientOnlyPackage({ packageRoot, policy: createPolicy() }),
            /Node self-resolution selected .*dist\/index\.js instead of .*dist\/index\.node\.js/,
        );
    });

    it('rejects a legacy main that bypasses the Node entry', async () => {
        const packageRoot = createPackage({}, { mainTarget: './dist/index.js' });

        await assert.rejects(
            verifyBuiltClientOnlyPackage({ packageRoot, policy: createPolicy() }),
            /Legacy main selected .*dist\/index\.js instead of .*dist\/index\.node\.js/,
        );
    });

    it('rejects a Node interface that does not enforce the client-only guard', async () => {
        const packageRoot = createPackage({
            'dist/node-api.js': [
                'export const widgetParts = [];',
                'export const Widget = { setup() {} };',
            ].join('\n'),
        });

        await assert.rejects(
            verifyBuiltClientOnlyPackage({ packageRoot, policy: createPolicy() }),
            /Node guard did not reject server rendering as client-only/,
        );
    });
});

function createPolicy(overrides = {}) {
    return {
        nodeClientMarkers: ['"vue"'],
        assertNodeInterface(module) {
            assert.deepEqual(module.widgetParts, []);
            assert.equal(typeof module.Widget?.setup, 'function');
        },
        invokeServerRender(module) {
            return module.Widget.setup();
        },
        verifyPackageOutput() {},
        ...overrides,
    };
}

function createPackage(
    files = {},
    { importBeforeNode = false, mainTarget = './dist/index.node.js' } = {},
) {
    const packageRoot = mkdtempSync(join(tmpdir(), 'ropav-built-client-only-'));
    fixtureRoots.push(packageRoot);

    const browserConditions = {
        types: './dist/index.d.ts',
        default: './dist/index.js',
    };
    const nodeConditions = {
        types: './dist/index.node.d.ts',
        default: './dist/index.node.js',
    };
    const rootConditions = importBeforeNode
        ? {
              browser: browserConditions,
              import: './dist/index.js',
              node: nodeConditions,
              types: './dist/index.d.ts',
              default: './dist/index.js',
          }
        : {
              browser: browserConditions,
              node: nodeConditions,
              types: './dist/index.d.ts',
              default: './dist/index.js',
          };
    writeFiles(packageRoot, {
        'package.json': JSON.stringify({
            name: `@fixture/widget-${fixtureRoots.length}`,
            version: '1.0.0',
            type: 'module',
            main: mainTarget,
            module: './dist/index.js',
            browser: './dist/index.js',
            types: './dist/index.d.ts',
            exports: {
                '.': rootConditions,
                './widget.css': './dist/widget.css',
            },
        }),
        'dist/index.d.ts': 'export declare const Widget: { setup(): void };',
        'dist/index.node.d.ts': [
            'export declare const Widget: { setup(): never };',
            'export declare const widgetParts: readonly [];',
        ].join('\n'),
        'dist/index.js': 'import { ref } from "vue"; export const Widget = ref;',
        'dist/index.node.js': 'export { Widget, widgetParts } from "./node-api.js";',
        'dist/node-api.js': [
            'export const widgetParts = [];',
            'export const Widget = { setup() { throw new Error("client-only fixture"); } };',
        ].join('\n'),
        'dist/widget.css': '.rp-widget { display: block; }',
        ...files,
    });
    return packageRoot;
}

function writeFiles(root, files) {
    for (const [relativeFile, source] of Object.entries(files)) {
        const file = join(root, relativeFile);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, source);
    }
}
