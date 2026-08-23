import type {StorybookConfig} from "@storybook/vue3-vite";

import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import {sync as globSync} from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));

const STORIES_GLOB = join(__dirname, "../../vue/src/**/*.stories.ts");

/**
 * All stories, or only the ones marked ready. A story counts as ready when its title
 * starts with `Components`, matching the filter on the React side.
 */
export const getStories = () => {
  const readyOnly = process.env["STORYBOOK_READY_ONLY"] === "true";

  if (!readyOnly) return [STORIES_GLOB];

  return globSync(STORIES_GLOB).filter((file: string) =>
    /title:\s*["']Components/.test(readFileSync(file, "utf-8")),
  );
};

const config: StorybookConfig = {
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
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
