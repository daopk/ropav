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
  /**
   * Docgen out of the builder and into the server, which is what Storybook 11 defaults to.
   * Both escapes from the deprecated engine land on the same replacement, so the tables are
   * unchanged bar better types and the loss of `class`, which the replacement calls a global
   * attribute. The server is the cheaper of the two: metadata is fetched when a docs page
   * opens rather than appended to every `.vue` module, and it picks the TypeScript project
   * per component file, so it finds the library's own `tsconfig.json` unaided.
   */
  features: {
    experimentalDocgenServer: true,
  },
  framework: {
    name: "@storybook/vue3-vite",
    options: {},
  },
  stories: [...getStories()],
};

export default config;
