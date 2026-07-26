import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';

import {
    verifyWorkspaceBundles,
    verifyWorkspaceContracts,
} from '../scripts/verify-workspace-contracts.mjs';

const fixtureRoots = [];

afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe('workspace contracts', () => {
    it('accepts the declared editor-to-ropav direction and direct Tiptap core usage', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/components/button/button.vue': vaporSfc('const label = "Button";'),
            },
        );
        createPackage(
            root,
            {
                dependencies: {
                    '@tiptap/core': '^3.0.0',
                    ropav: 'workspace:^',
                },
                name: '@ropav/editor',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/editor.vue': vaporSfc(
                    'import { Editor } from "@tiptap/core";\nconst editor = new Editor({ element: null });',
                ),
            },
        );

        assert.deepEqual(verifyWorkspaceContracts(root), []);
    });

    it('reports package, Vapor, Tiptap, helper, and dependency-direction violations together', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                dependencies: {
                    '@ropav/editor': 'workspace:^',
                },
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/index.ts': 'export * from "@ropav/editor/src/internal";',
            },
        );
        createPackage(
            root,
            {
                dependencies: {
                    ropav: '^1.0.0',
                },
                devDependencies: {
                    '@tiptap/vue-3': '^3.0.0',
                },
                name: '@ropav/editor',
                version: '1.0.0',
            },
            {
                'src/components/toolbar/helpers.ts': 'export const helper = true;',
                'src/editor.vue': [
                    '<template><div /></template>',
                    '<script setup lang="ts">',
                    'import { h } from "vue";',
                    'import { EditorContent } from "@tiptap/vue-3/renderer";',
                    'import "../../ropav/src/index";',
                    'h("div");',
                    '</script>',
                ].join('\n'),
                'src/utils/bad.ts': 'import "../components/toolbar/helpers";',
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        for (const expected of [
            'publishable packages must define scripts.verify',
            'must use @tiptap/core instead of @tiptap/vue-3',
            'internal dependency ropav in dependencies must use the workspace: protocol',
            'production Vue SFC must use <script setup vapor>',
            'forbidden VDOM pattern',
            'zero-VDOM Tiptap contract',
            'relative import "../../ropav/src/index" crosses a package seam',
            'generic component-local helper modules are forbidden',
            'utils cannot depend on components',
            'workspace dependency @ropav/editor violates the declared package direction',
            "reaches into another package's source",
        ]) {
            assert.match(violations, new RegExp(escapeRegExp(expected)));
        }
    });

    it('rejects missing or VDOM-backed publishable bundles', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {},
        );
        createPackage(
            root,
            {
                dependencies: {
                    ropav: 'workspace:^',
                },
                name: '@ropav/editor',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'dist/index.js':
                    'import { EditorContent } from "@tiptap/vue-3";\ncreateVNode(EditorContent);',
            },
        );

        const violations = verifyWorkspaceBundles(root).join('\n');
        assert.match(violations, /ropav: scripts\.verify must produce a dist directory/);
        assert.match(violations, /built output references @tiptap\/vue-3/);
        assert.match(violations, /built output matches forbidden VDOM pattern/);
    });
});

function createWorkspace() {
    const root = mkdtempSync(join(tmpdir(), 'ropav-workspace-contracts-'));
    fixtureRoots.push(root);
    return root;
}

function createPackage(workspaceRoot, manifest, files) {
    const directory = manifest.name === 'ropav' ? 'ropav' : 'editor';
    const packageRoot = join(workspaceRoot, 'packages', directory);
    writeFixtureFile(packageRoot, 'package.json', JSON.stringify(manifest, null, 2));
    for (const [path, content] of Object.entries(files)) {
        writeFixtureFile(packageRoot, path, content);
    }
}

function writeFixtureFile(packageRoot, path, content) {
    const target = join(packageRoot, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
}

function vaporSfc(script) {
    return [
        '<template><div /></template>',
        '<script setup lang="ts" vapor>',
        script,
        '</script>',
    ].join('\n');
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
