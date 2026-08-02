import path from "node:path";

import vue from "@vitejs/plugin-vue";
import {defineConfig} from "vitest/config";

export default defineConfig({
  plugins: [vue({features: {vapor: true}})],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // The `node` export condition of `vue` resolves to an entry WITHOUT the vapor
      // runtime, which makes `defineVaporComponent` undefined. Point at the
      // self-contained browser bundle, which ships vapor and imports nothing.
      vue: "vue/dist/vue.runtime-with-vapor.esm-browser.js",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
