import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import Icons from 'unplugin-icons/vite';

import { injectComponentCss } from './tooling/vite/inject-component-css';
import { rewriteDeclarationImportExtensions } from './tooling/vite/rewrite-declaration-import-extensions';
import { vaporIconCompiler } from './src/unplugin-icons';

const componentEntries = readdirSync(resolve(__dirname, 'src/components'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted()
    .reduce<Record<string, string>>((entries, name) => {
        entries[`components/${name}/index`] = resolve(__dirname, `src/components/${name}/index.ts`);
        return entries;
    }, {});

const declarationRoot = resolve(__dirname, 'dist');
const sourceRoot = resolve(__dirname, 'src');
const scssPrelude = `@use "@/styles/variables" as *;\n@use "@/styles/mixins" as *;\n`;

function addRopavScssLayers(source: string, filename: string) {
    const isComponentStyle =
        filename.includes('/src/components/') &&
        !filename.endsWith('.stories.scss') &&
        !filename.split('/').at(-1)?.startsWith('_');
    if (!isComponentStyle) return `${scssPrelude}${source}`;

    const uses: string[] = [];
    let body = source;
    let match: RegExpMatchArray | null;
    while ((match = body.match(/^\s*@use\s+[^;]+;\s*/))) {
        uses.push(match[0].trim());
        body = body.slice(match[0].length);
    }

    return `${scssPrelude}${uses.join('\n')}\n@layer ropav.components {\n${body}\n}\n`;
}

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: addRopavScssLayers,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [
        vue({
            features: {
                vapor: true,
            },
        }),
        Icons({
            compiler: vaporIconCompiler(),
        }),
        dts({
            tsconfigPath: './tsconfig.app.json',
            cleanVueFileName: true,
            include: [
                'src/index.ts',
                'src/styles-api.ts',
                'src/unplugin-icons.ts',
                'src/components/**/*.vue',
                'src/components/**/*.ts',
                'src/composables/**/*.ts',
                'src/internal/composables/useOverlayLayer.ts',
                'src/utils/componentColors.ts',
            ],
            exclude: [
                'src/**/*.story.*',
                'src/**/*.stories.*',
                'src/**/*.spec.*',
                'src/**/*.test.*',
            ],
            beforeWriteFile(filePath, content) {
                return {
                    content: rewriteDeclarationImportExtensions(filePath, content, {
                        declarationRoot,
                        sourceRoot,
                    }),
                };
            },
        }),
        injectComponentCss(),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                base: resolve(__dirname, 'src/styles/base.scss'),
                'composables/index': resolve(__dirname, 'src/composables/index.ts'),
                'unplugin-icons': resolve(__dirname, 'src/unplugin-icons.ts'),
                ...componentEntries,
            },
            formats: ['es'],
        },
        minify: false,
        sourcemap: false,
        cssCodeSplit: true,
        rolldownOptions: {
            external: ['@vue/compiler-vapor', 'focus-trap', 'vue'],
            output: {
                chunkFileNames: '[name].js',
            },
        },
    },
});
