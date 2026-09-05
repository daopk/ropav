import type { Theme } from "vitepress";
import type { Component } from "vue";

import DefaultTheme from "vitepress/theme";

import Demo from "./components/demo.vue";
import Layout from "./layout.vue";
import Playground from "./playground/playground.vue";
import { installVaporInterop } from "./vapor-interop";

import "../../styles/globals.css";

/**
 * Demos are prefixed on registration because the bare PascalCase of a file name collides
 * with the library's own exports - `card-header.vue` would shadow `CardHeader`.
 */
const demos = import.meta.glob<{ default: Component }>("./demos/*.vue", { eager: true });

const demoName = (path: string): string =>
  `Demo${path
    .slice("./demos/".length, -".vue".length)
    .replace(/(?:^|-)([a-z0-9])/g, (_, c: string) => c.toUpperCase())}`;

export default {
  Layout,

  enhanceApp({ app }) {
    installVaporInterop(app);

    app.component("Demo", Demo);
    app.component("Playground", Playground);

    for (const [path, module] of Object.entries(demos)) {
      app.component(demoName(path), module.default);
    }
  },
  extends: DefaultTheme,
} satisfies Theme;
