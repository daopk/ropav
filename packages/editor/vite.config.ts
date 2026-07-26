import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
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
        dts({
            tsconfigPath: './tsconfig.app.json',
            cleanVueFileName: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            exclude: ['src/**/*.spec.*', 'src/**/*.test.*'],
            bundleTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                'index.node': resolve(__dirname, 'src/index.node.ts'),
            },
            cssFileName: 'editor',
            fileName: (_format, entryName) => `${entryName}.js`,
            formats: ['es'],
        },
        minify: false,
        sourcemap: false,
        cssCodeSplit: false,
        rolldownOptions: {
            external: [
                '@tiptap/core',
                /^@tiptap\/pm(?:\/|$)/,
                '@tiptap/starter-kit',
                'ropav',
                'vue',
            ],
            output: {
                chunkFileNames: '[name].js',
            },
        },
    },
});
