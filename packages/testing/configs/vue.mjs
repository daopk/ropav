import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, mergeConfig } from "vitest/config";

import { baseConfig } from "./base.mjs";
import { createBrowserConfig } from "./browser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const setupFile = join(__dirname, "../setup/vue.ts");
const browserSetupFile = join(__dirname, "../setup/browser-vue.ts");

/**
 * The `node` export condition of `vue` resolves to an entry that does NOT carry the
 * vapor runtime, which leaves `defineVaporComponent` undefined and kills every vapor
 * SFC on import. Point at the self-contained browser bundle, which ships vapor and
 * imports nothing — aliasing the plain `esm-bundler` entry instead pulls in the whole
 * `@vue/*` family and loses named exports across the CJS interop boundary.
 */
const vaporAlias = { vue: "vue/dist/vue.runtime-with-vapor.esm-browser.js" };

/** jsdom defaults for Vue Vapor UI packages. */
export const vueConfig = mergeConfig(
  baseConfig,
  defineConfig({
    resolve: { alias: vaporAlias },
    test: {
      environment: "jsdom",
      globals: true,
      passWithNoTests: true,
      setupFiles: [setupFile],
    },
  }),
);

/** Playwright Chromium defaults for Vue Vapor `*.browser.test.ts`. */
export const vueBrowserConfig = mergeConfig(
  createBrowserConfig(browserSetupFile),
  defineConfig({
    resolve: { alias: vaporAlias },
  }),
);
