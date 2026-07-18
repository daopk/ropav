import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import { vaporIconCompiler } from 'ropav/unplugin-icons';

export default defineConfig({
    root: import.meta.dirname,
    plugins: [vue({ features: { vapor: true } }), Icons({ compiler: vaporIconCompiler() })],
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
