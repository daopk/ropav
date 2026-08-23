import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import { baseConfig } from "./base.mjs";

/**
 * Playwright Chromium defaults for `*.browser.test.*`.
 *
 * The provider and browser settings carry no framework of their own, so the setup file is
 * the caller's to supply. It has to be passed in here rather than overridden downstream:
 * Vitest's `mergeConfig` concatenates `setupFiles` instead of replacing them.
 *
 * @param {string} setupFile Absolute path to the setup file for this project.
 */
export const createBrowserConfig = (setupFile) =>
  mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        browser: {
          enabled: true,
          headless: true,
          instances: [{ browser: "chromium" }],
          provider: playwright(),
        },
        globals: true,
        passWithNoTests: true,
        setupFiles: [setupFile],
      },
    }),
  );
