import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        resolve: {
            alias: {
                vue: resolve(
                    __dirname,
                    'node_modules/vue/dist/vue.runtime-with-vapor.esm-browser.js',
                ),
            },
        },
        test: {
            environment: 'jsdom',
            include: ['src/**/*.test.ts'],
        },
    }),
);
