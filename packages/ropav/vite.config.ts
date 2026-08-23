import type {Plugin, Rollup} from "vite";

import fs from "node:fs";
import path from "node:path";

import vue from "@vitejs/plugin-vue";
import {defineConfig} from "vite";

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

    return {code: code.replace("__ROPAV_VERSION__", packageJson.version), map: null};
  },
});

/**
 * `preserveModules` emits every module in the graph, including the virtual
 * sub-modules `@vitejs/plugin-vue` creates per SFC block. Those land as dead
 * `*.vue2.js` files that nothing imports. Drop whatever no entry can reach.
 */
const pruneOrphanChunks = (): Plugin => ({
  generateBundle(_options, bundle) {
    const reachable = new Set<string>();
    const queue: string[] = [];

    const isChunk = (value: Rollup.OutputAsset | Rollup.OutputChunk): value is Rollup.OutputChunk =>
      value.type === "chunk";

    for (const [fileName, output] of Object.entries(bundle)) {
      if (isChunk(output) && output.isEntry) queue.push(fileName);
    }

    while (queue.length > 0) {
      const fileName = queue.pop();

      if (fileName === undefined || reachable.has(fileName)) continue;
      reachable.add(fileName);

      const output = bundle[fileName];

      if (!output || !isChunk(output)) continue;

      for (const next of [...output.imports, ...output.dynamicImports]) {
        if (!reachable.has(next)) queue.push(next);
      }
    }

    for (const [fileName, output] of Object.entries(bundle)) {
      if (isChunk(output) && !reachable.has(fileName)) delete bundle[fileName];
    }
  },
  name: "ropav-prune-orphan-chunks",
});

/**
 * One entry per component directory that has an `index.ts`, plus the root entry.
 * Auto-discovered so adding a component never means touching this file.
 */
const resolveEntries = () => {
  const entries: Record<string, string> = {index: "src/index.ts"};

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
    rollupOptions: {
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
    pruneOrphanChunks(),
    // Safety net only — every SFC opts in explicitly via `<script setup lang="ts" vapor>`
    vue({features: {vapor: true}}),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
