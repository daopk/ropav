import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitepress";

export default defineConfig({
  cleanUrls: true,
  description: "Beautiful and modern Vue UI library built with Vapor Mode and Tailwind CSS 4.",
  srcExclude: ["**/README.md"],

  themeConfig: {
    nav: [{ link: "/components/button", text: "Components" }],
    sidebar: {
      "/components/": [
        { items: [{ link: "/components/button", text: "Button" }], text: "Buttons" },
      ],
    },
    socialLinks: [{ icon: "github", link: "https://github.com/daopk/ropav" }],
  },
  title: "Ropav",

  /**
   * No `vue: { features: { vapor: true } }`. VitePress ships its theme as raw SFCs that this
   * same plugin instance compiles, and the flag is global. Every SFC in `ropav` carries the
   * `vapor` attribute itself, which the compiler picks up without any plugin option.
   */
  vite: {
    // `ropav` resolves to workspace source, so it is crawled rather than pre-bundled. Its own
    // dependencies are discovered through that crawl; naming them here instead only warns,
    // because they do not resolve from this package's own root.
    optimizeDeps: { exclude: ["@ropav/styles", "ropav"] },
    plugins: [tailwindcss()],
    // A second Vue is the one failure that silently breaks the Vapor runtime.
    resolve: { dedupe: ["@vue/runtime-dom", "@vue/shared", "vue"] },
  },
});
