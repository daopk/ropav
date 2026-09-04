#!/usr/bin/env node
/* eslint-disable no-console */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readComponentDirs } from "./component-dirs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PACKAGE_JSON_PATH = path.join(rootDir, "package.json");
const COMPONENTS_DIR = path.join(rootDir, "src/components");

/**
 * Scan the components directory and return sorted component names
 * that have an index.ts file.
 */
function scanComponents() {
  const { components, missingIndex } = readComponentDirs(COMPONENTS_DIR);

  for (const name of missingIndex) console.warn(`⚠️  Skipping ${name}: index.ts not found`);

  // Publishing a package.json with no subpaths is worse than not publishing: every
  // `ropav/<name>` import in the wild stops resolving, and nothing here would have said so.
  if (components.length === 0) throw new Error(`No components found in ${COMPONENTS_DIR}`);

  return components;
}

/**
 * Generate component exports and write them to package.json.
 * Called after clean-package has already backed up and cleaned the file.
 */
async function generateExports() {
  const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, "utf8"));
  const components = scanComponents();

  console.log(`📦 Found ${components.length} components`);

  // `default` must stay last — export condition order is significant
  /* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
  const exports = {
    ".": {
      import: "./dist/index.js",
      types: "./dist/index.d.ts",
    },
    "./package.json": "./package.json",
    "./styles": {
      style: "./dist/styles.css",
      default: "./dist/styles.css",
    },
    "./styles/no-preflight": {
      style: "./dist/styles-no-preflight.css",
      default: "./dist/styles-no-preflight.css",
    },
  };

  /* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

  for (const name of components) {
    exports[`./${name}`] = {
      import: `./dist/components/${name}/index.js`,
      types: `./dist/components/${name}/index.d.ts`,
    };
  }

  packageJson.exports = exports;

  await writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`✅ Updated package.json exports (${components.length} components)`);
}

generateExports().catch((error) => {
  console.error("❌ Failed:", error);
  process.exit(1);
});
