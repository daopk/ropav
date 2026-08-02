import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import {playwright} from "@vitest/browser-playwright";
import {defineConfig, mergeConfig} from "vitest/config";

import {baseConfig} from "./base.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reactSetupFile = join(__dirname, "../setup/browser.ts");

/**
 * Playwright Chromium defaults for `*.browser.test.*`.
 *
 * The provider and browser settings are framework-agnostic; only the setup file differs
 * per renderer. Vitest's `mergeConfig` concatenates `setupFiles`, so the setup file has
 * to be chosen here rather than overridden downstream.
 */
export const createBrowserConfig = (setupFile = reactSetupFile) =>
  mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        browser: {
          enabled: true,
          headless: true,
          instances: [{browser: "chromium"}],
          provider: playwright(),
        },
        globals: true,
        passWithNoTests: true,
        setupFiles: [setupFile],
      },
    }),
  );

/** Playwright Chromium defaults for React browser tests. */
export const browserConfig = createBrowserConfig();
