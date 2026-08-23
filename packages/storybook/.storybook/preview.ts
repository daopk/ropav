import type {Preview} from "@storybook/vue3-vite";

import {setup} from "@storybook/vue3-vite";
import {vaporInteropPlugin} from "vue";

import {withReduceMotion} from "./addons/reduce-motion/decorator";
import {reduceMotionGlobalType} from "./addons/reduce-motion/preview";
import {withTheme} from "./addons/theme/decorator";
import {themeGlobalType} from "./addons/theme/preview";
import {DocsContainer} from "./components/docs-container";

import "./globals.css";

/**
 * The only place in this repository that may use `vaporInteropPlugin`.
 *
 * Storybook renders stories with a VDOM `createApp`, and every component in
 * `ropav` is Vapor. The plugin bridges VDOM parent to Vapor child, which is the
 * direction it is designed for and the one that is well supported.
 */
setup((app) => {
  app.use(vaporInteropPlugin);
});

const parameters: Preview["parameters"] = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    container: DocsContainer,
  },
  layout: "fullscreen",
  options: {
    storySort: {
      method: "alphabetical",
    },
  },
};

const preview: Preview = {
  decorators: [withTheme, withReduceMotion],
  globalTypes: {
    ...themeGlobalType,
    ...reduceMotionGlobalType,
  },
  parameters,
  tags: ["autodocs"],
};

export default preview;
