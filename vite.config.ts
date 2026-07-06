import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import Icons from 'unplugin-icons/vite';

import { injectComponentCss } from './config/inject-component-css';
import { createVaporIconCompiler } from './config/vapor-icon-compiler';

const componentDirs = ['button', 'checkbox', 'input', 'radio', 'select', 'switch', 'textarea'];

const componentEntries = componentDirs.reduce<Record<string, string>>((entries, name) => {
    entries[`components/${name}/index`] = resolve(__dirname, `src/components/${name}/index.ts`);
    return entries;
}, {});

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "@/styles/variables" as *;\n@use "@/styles/mixins" as *;\n`,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    plugins: [
        vue(),
        Icons({
            compiler: createVaporIconCompiler(),
        }),
        dts({
            tsconfigPath: './tsconfig.app.json',
            cleanVueFileName: true,
            include: ['src/index.ts', 'src/components/**/*.vue', 'src/components/**/*.ts'],
            exclude: [
                'src/**/*.story.*',
                'src/**/*.stories.*',
                'src/**/*.spec.*',
                'src/**/*.test.*',
            ],
        }),
        injectComponentCss(),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                base: resolve(__dirname, 'src/styles/base.scss'),
                ...componentEntries,
            },
            formats: ['es'],
        },
        minify: false,
        sourcemap: true,
        cssCodeSplit: true,
        rolldownOptions: {
            external: ['vue'],
            output: {
                chunkFileNames: '[name].js',
            },
        },
    },
});
