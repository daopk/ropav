import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

const dirname = import.meta.dirname;

/**
 * Every story, checked under Forced Colors Mode.
 *
 * The component suite in `ropav` asserts computed styles, and this whole class of bug is
 * invisible to that: the browser's own colour override happens after the cascade, so every
 * declared colour still reports correctly while the component renders as a blank block. The
 * check runs against what the story actually resolves to, which is the only place the failure
 * shows up.
 *
 * Reuses `vite.config.ts` rather than restating it - the Vapor plugin, the icon compiler and
 * Tailwind all have to be present or the stories do not compile.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [await storybookTest({ configDir: path.join(dirname, ".storybook") })],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "chromium" }],
        provider: playwright(),
      },
      name: "storybook-forced-colors",
      setupFiles: [path.join(dirname, ".storybook/vitest.setup.ts")],
    },
  }),
);
