import type { Plugin } from "vite";

import fs from "node:fs";
import path from "node:path";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

const COMPONENTS_DIR = "src/components";

/** Directories under `src/components` that are not components. Kept in step with `scripts/`. */
// `overlay` is the shared layer positioned overlays are built on, not a component of its own,
// so it gets no subpath and no entry.
const SKIP_DIRS = new Set(["icons", "utils", "composables", "overlay", "dnd", "date-input-group"]);

/**
 * Replace the version placeholder in `src/version.ts` with the real version.
 */
const replaceVersion = (): Plugin => ({
  name: "ropav-replace-version",
  transform(code, id) {
    if (!id.includes("version.ts")) return null;

    return { code: code.replace("__ROPAV_VERSION__", packageJson.version), map: null };
  },
});

/**
 * Fold each SFC's script block back into the file named after the component.
 *
 * `@vitejs/plugin-vue` compiles `<script setup>` into a separate module, addressed by a query on
 * the SFC's own id. Rollup used to inline that module; rolldown keeps it, so `preserveModules`
 * emits two files per SFC — `card-root.js`, holding nothing but a default re-export, and
 * `card-root.vue_vue_type_script_setup_true_vapor_true_lang.js`, holding the component. That is
 * 342 extra files and a fifth more weight on a package whose whole point is to be imported a
 * piece at a time.
 *
 * Folding is only safe because the wrapper does exactly one thing. Each is checked before it is
 * touched: it must import the script module and nothing else, and the script module must have no
 * other importer. Both sit in the same directory, so the relative specifiers inside the script
 * block still resolve once it moves up.
 */
const inlineSfcScriptChunks = (): Plugin => ({
  generateBundle(_options, bundle) {
    const SCRIPT_BLOCK = /^(.*)\.vue_vue_type_script_[^/]*\.js$/;

    const importerCounts = new Map<string, number>();

    for (const output of Object.values(bundle)) {
      if (output.type !== "chunk") continue;
      for (const imported of output.imports) {
        importerCounts.set(imported, (importerCounts.get(imported) ?? 0) + 1);
      }
    }

    for (const [fileName, output] of Object.entries(bundle)) {
      const match = SCRIPT_BLOCK.exec(fileName);

      if (!match || output.type !== "chunk") continue;
      if (importerCounts.get(fileName) !== 1) continue;

      const wrapperName = `${match[1]}.js`;
      const wrapper = bundle[wrapperName];

      if (!wrapper || wrapper.type !== "chunk") continue;
      if (wrapper.imports.length !== 1 || wrapper.imports[0] !== fileName) continue;

      wrapper.code = output.code;
      wrapper.imports = output.imports;
      wrapper.dynamicImports = output.dynamicImports;
      delete bundle[fileName];
    }
  },
  name: "ropav-inline-sfc-script-chunks",
});

/**
 * One entry per component directory that has an `index.ts`, plus the root entry.
 * Auto-discovered so adding a component never means touching this file.
 */
const resolveEntries = () => {
  const entries: Record<string, string> = { index: "src/index.ts" };

  if (!fs.existsSync(COMPONENTS_DIR)) return entries;

  for (const name of fs.readdirSync(COMPONENTS_DIR)) {
    if (SKIP_DIRS.has(name)) continue;

    const dir = path.join(COMPONENTS_DIR, name);

    if (!fs.statSync(dir).isDirectory()) continue;
    if (!fs.existsSync(path.join(dir, "index.ts"))) continue;

    entries[`components/${name}/index`] = path.join(dir, "index.ts");
  }

  return entries;
};

const external = [
  ...Object.keys(packageJson.peerDependencies ?? {}),
  ...Object.keys(packageJson.dependencies ?? {}),
  /^vue($|\/)/,
  /^@ropav\/styles($|\/)/,
  /^tailwind-variants($|\/)/,
];

export default defineConfig({
  build: {
    // `scripts/build.mjs` owns cleaning so the styles copy step is not wiped
    emptyOutDir: false,
    lib: {
      entry: resolveEntries(),
      formats: ["es"],
    },
    minify: false,
    outDir: "dist",
    rolldownOptions: {
      external,
      output: {
        entryFileNames: "[name].js",
        exports: "named",
        format: "es",
        hoistTransitiveImports: false,
        preserveModules: true,
        preserveModulesRoot: "src",
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
    sourcemap: false,
    target: "esnext",
  },
  plugins: [
    replaceVersion(),
    inlineSfcScriptChunks(),
    // Safety net only — every SFC opts in explicitly via `<script setup lang="ts" vapor>`
    vue({ features: { vapor: true } }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
