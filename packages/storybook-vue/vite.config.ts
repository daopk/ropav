import {default as tailwindcss} from "@tailwindcss/vite";
import {default as vue} from "@vitejs/plugin-vue";
import {defineConfig} from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["sb-vite"],
    include: ["@mdx-js/react"],
  },
  // `features.vapor` is only a safety net — every SFC in `@heroui/vue` opts in itself.
  plugins: [vue({features: {vapor: true}}), tailwindcss()],
});
