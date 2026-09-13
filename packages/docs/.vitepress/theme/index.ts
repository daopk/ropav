import type { Theme } from "vitepress";
import type { App, Component } from "vue";

import DefaultTheme from "vitepress/theme";

import Api from "./components/api.vue";
import ComponentIndex from "./components/component-index.vue";
import Demo from "./components/demo.vue";
import StorybookLink from "./components/storybook-link.vue";
import Layout from "./layout.vue";
import Playground from "./playground/playground.vue";
import { installVaporInterop } from "./vapor-interop";

import "../../styles/globals.css";

const demos = import.meta.glob<{ default: Component }>("./demos/*.vue", { eager: true });
const patterns = import.meta.glob<{ default: Component }>("./patterns/*.vue", { eager: true });

/**
 * Prefixed on registration because the bare PascalCase of a file name collides with the
 * library's own exports - `card-header.vue` would shadow `CardHeader`. The prefix also says
 * which directory a tag on a page came from.
 */
const register = (
  app: App,
  prefix: string,
  modules: Record<string, { default: Component }>,
): void => {
  for (const [path, module] of Object.entries(modules)) {
    const file = path.slice(path.lastIndexOf("/") + 1, -".vue".length);
    const name = file.replace(/(?:^|-)([a-z0-9])/g, (_, c: string) => c.toUpperCase());

    app.component(`${prefix}${name}`, module.default);
  }
};

export default {
  Layout,

  enhanceApp({ app }) {
    installVaporInterop(app);

    app.component("Api", Api);
    app.component("ComponentIndex", ComponentIndex);
    app.component("Demo", Demo);
    app.component("Playground", Playground);
    app.component("StorybookLink", StorybookLink);

    register(app, "Demo", demos);
    register(app, "Pattern", patterns);
  },
  extends: DefaultTheme,
} satisfies Theme;
