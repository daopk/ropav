import { defineConfig, mergeConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import viteConfig from './vite.config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default mergeConfig(viteConfig, defineConfig({
  resolve: {
    alias: {
      vue: resolve(rootDir, 'node_modules/vue/dist/vue.runtime-with-vapor.esm-browser.js'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.ts'],
          css: false,
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: resolve(rootDir, '.storybook'),
            storybookScript: 'pnpm storybook --no-open',
            tags: {
              include: ['test'],
            },
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
}));
