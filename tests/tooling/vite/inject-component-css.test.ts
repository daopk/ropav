import { describe, expect, it } from 'vitest';

import {
    injectComponentCss,
    injectComponentCssImports,
} from '../../../tooling/vite/inject-component-css';

describe('injectComponentCss', () => {
    it('only applies to library builds', () => {
        const apply = injectComponentCss().apply;
        expect(apply).toBeTypeOf('function');
        if (typeof apply !== 'function') return;

        expect(
            apply(
                { build: { lib: { entry: 'src/index.ts' } } },
                { command: 'build', mode: 'production' },
            ),
        ).toBe(true);
        expect(
            apply(
                { build: { lib: { entry: 'src/index.ts' } } },
                { command: 'serve', mode: 'development' },
            ),
        ).toBe(false);
        expect(apply({}, { command: 'build', mode: 'production' })).toBe(false);
    });

    it('prepends each chunk with relative imports for its emitted CSS', () => {
        const bundle = {
            'components/button/index.js': {
                type: 'chunk' as const,
                fileName: 'components/button/index.js',
                code: 'export const button = true;',
                viteMetadata: {
                    importedCss: new Set(['assets/button.css', 'base.css']),
                },
            },
            'components/alert/index.js': {
                type: 'chunk' as const,
                fileName: 'components/alert/index.js',
                code: 'export const alert = true;',
            },
            'assets/button.css': {
                type: 'asset' as const,
                fileName: 'assets/button.css',
            },
        };

        injectComponentCssImports(bundle);

        expect(bundle['components/button/index.js'].code).toBe(
            [
                "import '../../assets/button.css';",
                "import '../../base.css';",
                'export const button = true;',
            ].join('\n'),
        );
        expect(bundle['components/alert/index.js'].code).toBe('export const alert = true;');
    });
});
