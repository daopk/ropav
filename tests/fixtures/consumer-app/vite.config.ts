import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import { vaporIconCompiler } from 'ropav/unplugin-icons';

export default defineConfig({
    root: import.meta.dirname,
    plugins: [
        vue({ features: { vapor: true } }),
        Icons({
            compiler: vaporIconCompiler(),
            customCollections: {
                regression: {
                    gradient:
                        '<svg viewBox="0 0 24 24"><defs><linearGradient id="paint"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><path fill="url(#paint)" d="M2 2h20v20H2z"/></svg>',
                },
            },
        }),
    ],
    resolve: {
        alias: {
            vue: resolve(
                import.meta.dirname,
                '../../../node_modules/vue/dist/vue.runtime-with-vapor.esm-browser.prod.js',
            ),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
