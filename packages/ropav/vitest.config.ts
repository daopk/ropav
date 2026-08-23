import path from "node:path";

import {vueBrowserConfig, vueConfig} from "@ropav/testing/configs/vue";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import {defineConfig, mergeConfig} from "vitest/config";

const srcDir = path.resolve(import.meta.dirname, "src");

const alias = {"@": srcDir};

/** Dual-project: jsdom (`*.test.ts`) + Playwright (`*.browser.test.ts`). */
export default defineConfig({
  test: {
    projects: [
      mergeConfig(
        vueConfig,
        defineConfig({
          plugins: [vue({features: {vapor: true}})],
          resolve: {alias},
          test: {
            exclude: ["**/node_modules/**", "**/dist/**", "**/*.browser.test.ts"],
            include: ["tests/**/*.test.ts"],
            name: "vue-jsdom",
            passWithNoTests: false,
          },
        }),
      ),
      mergeConfig(
        vueBrowserConfig,
        defineConfig({
          plugins: [vue({features: {vapor: true}}), tailwindcss()],
          resolve: {alias},
          test: {
            exclude: ["**/node_modules/**", "**/dist/**"],
            include: ["tests/**/*.browser.test.ts"],
            name: "vue-browser",
            passWithNoTests: false,
            // Appended to the shared browser setup, which merges rather than replaces.
            setupFiles: [path.resolve(import.meta.dirname, "tests/setup-styles.ts")],
          },
        }),
      ),
    ],
  },
});
