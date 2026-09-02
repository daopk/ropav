import type { StorybookConfig } from "@storybook/vue3-vite";

import { globSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Specifiers stay relative to this directory, which is what Storybook resolves them against.
 * `@storybook/addon-vitest` reads the same field to decide which files to turn into tests, and
 * it resolves them the same way - an absolute path arrives there already joined to the config
 * dir, and matches nothing.
 */
const STORIES_GLOB = "../../ropav/src/**/*.stories.ts";

/**
 * All stories, or only the ones marked ready. A story counts as ready when its title
 * starts with `Components`, matching the filter on the React side.
 */
export const getStories = () => {
  const readyOnly = process.env["STORYBOOK_READY_ONLY"] === "true";

  if (!readyOnly) return [STORIES_GLOB];

  return globSync(join(__dirname, STORIES_GLOB))
    .filter((file: string) => /title:\s*["']Components/.test(readFileSync(file, "utf-8")))
    .map((file: string) => relative(__dirname, file));
};

const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-vitest"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
    enableCrashReports: false,
  },
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  stories: [...getStories()],
};

export default config;
