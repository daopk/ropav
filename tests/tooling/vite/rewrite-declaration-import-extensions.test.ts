import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { rewriteDeclarationImportExtensions } from '../../../tooling/vite/rewrite-declaration-import-extensions';

const declarationRoot = resolve('/project/dist');
const sourceRoot = resolve('/project/src');
const declarationPath = resolve(declarationRoot, 'components/example/index.d.ts');

function rewrite(content: string) {
    return rewriteDeclarationImportExtensions(declarationPath, content, {
        declarationRoot,
        sourceRoot,
        fileExists: (filePath) =>
            filePath === resolve(sourceRoot, 'components/example/nested/index.ts'),
    });
}

describe('rewriteDeclarationImportExtensions', () => {
    it('adds JavaScript extensions to relative module specifiers', () => {
        const content = [
            "import value from './value';",
            "import './setup';",
            "export { helper } from '../helper';",
            "export * from './nested';",
            "import legacy = require('./legacy');",
            "export type Lazy = import('./lazy').Lazy;",
            'export declare const load: () => Promise<typeof import("./dynamic")>;',
            "declare module './augmentation' {}",
        ].join('\n');

        expect(rewrite(content)).toBe(
            [
                "import value from './value.js';",
                "import './setup.js';",
                "export { helper } from '../helper.js';",
                "export * from './nested/index.js';",
                "import legacy = require('./legacy.js');",
                "export type Lazy = import('./lazy.js').Lazy;",
                'export declare const load: () => Promise<typeof import("./dynamic.js")>;',
                "declare module './augmentation.js' {}",
            ].join('\n'),
        );
    });

    it('preserves package imports, explicit extensions, and specifier suffixes', () => {
        const content = [
            "import type { Ref } from 'vue';",
            "export * from './existing.js';",
            "export * from './source.vue';",
            "export * from './raw?inline';",
            "export * from './fragment#named';",
        ].join('\n');

        expect(rewrite(content)).toBe(
            [
                "import type { Ref } from 'vue';",
                "export * from './existing.js';",
                "export * from './source.vue';",
                "export * from './raw.js?inline';",
                "export * from './fragment.js#named';",
            ].join('\n'),
        );
    });

    it('does not rewrite comments, JSDoc examples, or ordinary string literals', () => {
        const content = [
            "/** Example: import('./documentation') and export from './documentation'. */",
            "// import('./comment')",
            'export declare const example = "import(\'./string-value\')";',
            "export declare const source = './plain-string';",
        ].join('\n');

        expect(rewrite(content)).toBe(content);
    });
});
