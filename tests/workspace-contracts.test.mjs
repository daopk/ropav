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
    it('accepts the declared specialized-package directions', () => {
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
                'src/components/editor/editor.vue': vaporSfc(
                    'import { Editor } from "@tiptap/core";\nconst editor = new Editor({ element: null });',
                ),
            },
        );
        createPackage(
            root,
            {
                dependencies: {
                    '@tanstack/table-core': '^8.0.0',
                    ropav: 'workspace:^',
                },
                name: '@ropav/table',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/components/table/table.vue': vaporSfc(
                    'import { createTable } from "@tanstack/table-core";\nconst table = createTable;',
                ),
            },
        );

        assert.deepEqual(verifyWorkspaceContracts(root), []);
    });

    it('rejects the Vue TanStack adapter from the table manifest and production source', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                dependencies: {
                    'tanstack-vue-adapter': 'npm:@tanstack/vue-table@^8.0.0',
                },
                devDependencies: {
                    '@tanstack/vue-table': '^8.0.0',
                },
                name: '@ropav/table',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/components/table/useTable.ts': [
                    'import { useVueTable } from "@tanstack/vue-table";',
                    'export { FlexRender } from "@tanstack/vue-table/renderer";',
                    'export const loadAdapter = () => import("@tanstack/vue-table/adapters");',
                    'export const table = useVueTable;',
                ].join('\n'),
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        assert.match(
            violations,
            /@ropav\/table: devDependencies must use @tanstack\/table-core instead of @tanstack\/vue-table/,
        );
        assert.match(
            violations,
            /@ropav\/table: dependencies must use @tanstack\/table-core instead of @tanstack\/vue-table through npm alias "tanstack-vue-adapter"/,
        );
        for (const specifier of [
            '@tanstack/vue-table',
            '@tanstack/vue-table/adapters',
            '@tanstack/vue-table/renderer',
        ]) {
            assert.match(
                violations,
                new RegExp(
                    `@ropav/table/components/table/useTable\\.ts: import ${escapeRegExp(JSON.stringify(specifier))} violates the zero-VDOM TanStack Table contract`,
                ),
            );
        }
    });

    it('rejects component-local modules outside the canonical component directory', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                name: '@ropav/editor',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/components/editor/editor.vue': vaporSfc(
                    'import { helper } from "../../editor/helpers";\nconst value = helper;',
                ),
                'src/editor/helpers.ts': 'export const helper = true;',
            },
        );

        assert.match(
            verifyWorkspaceContracts(root).join('\n'),
            /editor\/helpers\.ts: component-local modules for editor must live under src\/components\/editor\//,
        );
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
            'production Vue SFC must live under src/components/<name>/',
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

    it('detects aliased Vue VDOM imports, re-exports, namespace access, and direct h calls', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/index.js':
                    'import { h as render } from "vue";\nexport const view = render("div");',
                'src/reexport.js': 'export { h as render } from "@vue/runtime-core";',
                'src/namespace.js':
                    'import * as Vue from "vue";\nconst { h: render } = Vue;\nrender("div");',
                'src/computed.cjs':
                    'const Vue = require("vue");\nconst { ["h"]: render } = Vue;\nrender("div");',
                'src/quoted.cjs': 'const { "h": render } = require("vue");\nrender("div");',
                'src/require.cjs': 'const render = require("vue").h;\nrender("div");',
                'src/dynamic.js': 'const { h: render } = await import("vue");\nrender("div");',
                'src/direct.js': 'h("div");',
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        assert.match(
            violations,
            /ropav\/index\.js: production source matches forbidden VDOM pattern imported Vue API h/,
        );
        assert.match(
            violations,
            /ropav\/reexport\.js: production source matches forbidden VDOM pattern imported Vue API h/,
        );
        for (const file of [
            'computed.cjs',
            'dynamic.js',
            'namespace.js',
            'quoted.cjs',
            'require.cjs',
        ]) {
            assert.match(
                violations,
                new RegExp(
                    `ropav/${escapeRegExp(file)}: production source matches forbidden VDOM pattern imported Vue API h`,
                ),
            );
        }
        assert.match(
            violations,
            /ropav\/direct\.js: production source matches forbidden VDOM pattern/,
        );
    });

    it('detects aliased Vue VDOM imports in bundles without rejecting generic h calls', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'dist/index.js':
                    'import { h as render } from "vue";\nexport const view = render("div");',
                'dist/safe.js': 'function h(value){return value}h("not VDOM");',
            },
        );

        const violations = verifyWorkspaceBundles(root).join('\n');
        assert.match(
            violations,
            /ropav\/dist\/index\.js: built output matches forbidden VDOM pattern imported Vue API h/,
        );
        assert.doesNotMatch(violations, /ropav\/dist\/safe\.js/);
    });

    it('rejects unexported workspace subpaths while accepting exact and wildcard exports', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                exports: {
                    '.': './dist/index.js',
                    './*': './dist/*.js',
                    './dist/*': null,
                    './features/*': './dist/features/*.js',
                    './private/*': null,
                    './tokens': './dist/tokens.js',
                },
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/index.ts': 'export const component = true;',
            },
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
                'src/index.ts': [
                    'import "ropav/dist/internal.js";',
                    'import "ropav/features/button";',
                    'import "ropav/private/secret";',
                    'import "ropav/";',
                    'import "ropav/tokens";',
                ].join('\n'),
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        assert.match(
            violations,
            /workspace import "ropav\/dist\/internal\.js" is not exposed by ropav package\.json exports/,
        );
        assert.match(
            violations,
            /workspace import "ropav\/private\/secret" is not exposed by ropav package\.json exports/,
        );
        assert.match(
            violations,
            /workspace import "ropav\/" is not exposed by ropav package\.json exports/,
        );
        assert.doesNotMatch(violations, /workspace import "ropav\/features\/button"/);
        assert.doesNotMatch(violations, /workspace import "ropav\/tokens"/);
    });

    it('rejects TypeScript path aliases that resolve across package boundaries', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                exports: {
                    '.': './dist/index.js',
                },
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/components/button/button.vue': vaporSfc('const label = "Button";'),
                'src/index.ts': 'export const component = true;',
            },
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
                'src/index.ts':
                    'import "#local-fallback";\nimport "#local-first";\nimport "#ropav-button";\nimport "#ropav-internal";',
                'src/local.ts': 'export const local = true;',
                'tsconfig.app.json': JSON.stringify({
                    compilerOptions: {
                        module: 'ESNext',
                        moduleResolution: 'Bundler',
                        paths: {
                            '#local-fallback': ['../ropav/src/missing.vue', './src/local.ts'],
                            '#local-first': ['./src/local.ts', '../ropav/src/index.ts'],
                            '#ropav-button': ['../ropav/src/components/button/button.vue'],
                            '#ropav-internal': ['../ropav/src/index.ts'],
                        },
                    },
                    include: ['src/**/*.ts'],
                }),
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        assert.match(
            violations,
            /import "#ropav-internal" resolves across the ropav package seam; import through its public workspace package interface/,
        );
        assert.match(
            violations,
            /import "#ropav-button" resolves across the ropav package seam; import through its public workspace package interface/,
        );
        assert.doesNotMatch(violations, /import "#local-fallback" resolves across/);
        assert.doesNotMatch(violations, /import "#local-first" resolves across/);
    });

    it('rejects unavailable package roots and internal imports from a package root barrel', () => {
        const root = createWorkspace();
        createPackage(
            root,
            {
                exports: {
                    './button': './dist/button.js',
                },
                name: 'ropav',
                scripts: { verify: 'test' },
                version: '1.0.0',
            },
            {
                'src/index.ts': 'import "ropav";',
            },
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
                'src/index.ts': 'import "ropav";',
            },
        );

        const violations = verifyWorkspaceContracts(root).join('\n');
        assert.match(violations, /internal source must not import its own package root barrel/);
        assert.match(
            violations,
            /workspace import "ropav" is not exposed by ropav package\.json exports/,
        );
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
