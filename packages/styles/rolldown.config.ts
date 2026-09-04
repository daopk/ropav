import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "rolldown";

const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

const COMPONENTS_DIR = "src/components";

/**
 * One entry per component directory that has an `index.ts`, plus the root entry.
 * Auto-discovered so adding a component never means touching this file.
 */
const resolveEntries = () => {
  const entries: Record<string, string> = { index: "src/index.ts" };

  for (const name of fs.readdirSync(COMPONENTS_DIR)) {
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
];

export default defineConfig({
  external,
  input: resolveEntries(),
  output: {
    dir: "dist",
    exports: "named",
    format: "es",
    hoistTransitiveImports: false,
    preserveModules: true,
    preserveModulesRoot: "src",
    sourcemap: false,
  },
  // The package is framework-agnostic and never touches the DOM, so neither the browser nor the
  // node resolution defaults apply. Every runtime dependency is external and `preserveModules`
  // keeps the source layout, so nothing is resolved out of `node_modules` anyway.
  platform: "neutral",
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
});
