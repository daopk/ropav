import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitepress";

import { playgroundBlock } from "./markdown/playground-block.ts";
import { colorReplacements } from "./theme/playground/code-theme.ts";

/**
 * Puts the stored palette on `<html>` before the first paint, so a reader who chose one does
 * not watch the default flash past. Mirrors the appearance class VitePress restores itself.
 */
const PALETTE_BOOT = `;(() => {
  try {
    const palette = localStorage.getItem("ropav-palette");

    if (palette) document.documentElement.dataset.theme = palette;
  } catch {}
})();`;

export default defineConfig({
  cleanUrls: true,
  description: "Beautiful and modern Vue UI library built with Vapor Mode and Tailwind CSS 4.",
  head: [["script", { id: "check-palette" }, PALETTE_BOOT]],

  // One constant drives the build and the browser, so a repainted block matches its neighbours.
  markdown: { colorReplacements, config: playgroundBlock },
  // The page glob excludes only what this names — nothing built-in keeps it out of `.vitepress`.
  srcExclude: ["**/README.md", ".vitepress/generated/**"],

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
