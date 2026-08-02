import {default as tailwindcss} from "@tailwindcss/vite";
import {default as vue} from "@vitejs/plugin-vue";
import {default as Icons} from "unplugin-icons/vite";
import {defineConfig} from "vite";

import {vaporIconCompiler} from "./.storybook/vapor-icon-compiler";

export default defineConfig({
  optimizeDeps: {
    exclude: ["sb-vite"],
    include: ["@mdx-js/react"],
  },
  // `features.vapor` is only a safety net — every SFC in `@heroui/vue` opts in itself.
  plugins: [
    vue({features: {vapor: true}}),
    // Story icons are compiled to Vapor components, so they render on the same path as
    // the components they are placed in.
    Icons({compiler: vaporIconCompiler()}),
    tailwindcss(),
  ],
});
