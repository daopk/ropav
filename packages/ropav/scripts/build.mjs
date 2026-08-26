/* eslint-disable no-console */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import fs from "fs-extra";

import { readComponentDirs } from "./component-dirs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

async function clean() {
  console.log("🧹 Cleaning dist directory...");
  await fs.remove(distDir);
}

async function build() {
  console.log("📦 Building with Vite (library mode)...");
  execSync("vite build", { cwd: rootDir, stdio: "inherit" });
}

async function buildStyles() {
  console.log("🎨 Creating styles export...");
  await fs.copy(path.join(rootDir, "src/styles.css"), path.join(distDir, "styles.css"));
  console.log("✅ Styles export created successfully");
}

/**
 * Emit `.d.ts` via `vue-tsc`, which handles SFCs (including `vapor` ones).
 * The repo tsconfig sets `noEmit`, so a throwaway config is used.
 */
async function generateTypes() {
  console.log("📝 Generating TypeScript declarations with vue-tsc...");

  const tsconfigPath = path.join(rootDir, "tsconfig.build.json");

  await fs.writeJson(
    tsconfigPath,
    {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        declaration: true,
        declarationMap: false,
        emitDeclarationOnly: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        isolatedModules: true,
        lib: ["DOM", "DOM.Iterable", "ESNext"],
        module: "ESNext",
        moduleResolution: "bundler",
        outDir: "./dist",
        paths: { "@/*": ["./src/*"] },
        resolveJsonModule: true,
        rootDir: "./src",
        skipLibCheck: true,
        strict: true,
        target: "ESNext",
        verbatimModuleSyntax: true,
      },
      // `story-meta.ts` is a story-authoring type only, and it names a devDependency —
      // shipping its declaration would leave a dangling reference in the package.
      exclude: ["node_modules", "**/*.stories.*", "**/*.test.*", "src/utils/story-meta.ts", "dist"],
      include: ["src"],
    },
    { spaces: 2 },
  );

  try {
    execSync("vue-tsc --project tsconfig.build.json", { cwd: rootDir, stdio: "inherit" });
    await renameSfcDeclarations();
    await rewriteDeclarationSpecifiers();
    console.log("✅ TypeScript declarations generated successfully");
  } finally {
    await fs.remove(tsconfigPath);
  }
}

/** Walk `dist` and hand every file to `visit`. */
async function walkDist(visit) {
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) await walk(entryPath);
      else await visit(entryPath);
    }
  }

  await walk(distDir);
}

/**
 * Name each SFC declaration after the JS file Vite emits for it.
 *
 * Two things are off otherwise. The tsgo bridge names a declaration by splitting
 * the source name at its *first* dot, so Volar's virtual `button.vue.ts` lands as
 * `button.vue.d.vue.ts` rather than `button.vue.d.ts`. And even spelled right,
 * `button.vue.d.ts` pairs with a `button.vue.js` that Vite never emits — the
 * bundle calls it `button.js`. Dropping the `.vue` infix settles both, and lets
 * `rewriteDeclarationSpecifiers` point `./button.vue` at `./button.js`.
 */
async function renameSfcDeclarations() {
  let renamed = 0;

  await walkDist(async (filePath) => {
    const suffix = [".vue.d.vue.ts", ".vue.d.ts"].find((candidate) => filePath.endsWith(candidate));

    if (!suffix) return;

    const target = `${filePath.slice(0, -suffix.length)}.d.ts`;

    // A `button.ts` sitting beside `button.vue` would have claimed this name already.
    if (fs.existsSync(target)) {
      throw new Error(
        `Cannot rename ${path.relative(distDir, filePath)}: ${path.basename(target)} exists`,
      );
    }

    await fs.rename(filePath, target);
    renamed++;
  });

  if (renamed > 0) console.log(`   ↳ renamed ${renamed} SFC declarations to match their JS output`);
}

/** `from "…"` and `import("…")`, capturing the specifier. */
const RELATIVE_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.[^"']*)\2/g;

/**
 * Give every relative specifier in the emitted `.d.ts` files an explicit `.js`
 * extension.
 *
 * `moduleResolution: "bundler"` lets `vue-tsc` emit `./modal.types` and `../..`
 * verbatim. Bundlers cope; a consumer on `node16`/`nodenext` does not, because
 * ESM resolution there has no extension search and no directory index. Rewriting
 * to `./modal.types.js` and `../../index.js` keeps both happy — TypeScript maps
 * the `.js` back onto the neighbouring `.d.ts` under every resolution mode.
 */
async function rewriteDeclarationSpecifiers() {
  const unresolved = [];
  let rewritten = 0;

  /** Resolve `specifier` against `dist` and return it with an explicit extension. */
  function withExtension(specifier, fromFile) {
    if (/\.(?:js|json|css)$/.test(specifier)) return specifier;

    // `./button.vue` now has its declaration at `button.d.ts`, next to `button.js`.
    const target = specifier.endsWith(".vue") ? specifier.slice(0, -".vue".length) : specifier;
    const resolved = path.resolve(path.dirname(fromFile), target);

    if (fs.existsSync(path.join(resolved, "index.d.ts"))) return `${target}/index.js`;
    if (fs.existsSync(`${resolved}.d.ts`)) return `${target}.js`;

    unresolved.push(`${path.relative(distDir, fromFile)} → ${specifier}`);

    return specifier;
  }

  await walkDist(async (filePath) => {
    if (!filePath.endsWith(".d.ts")) return;

    const source = await fs.readFile(filePath, "utf8");
    const output = source.replace(RELATIVE_SPECIFIER, (match, lead, quote, specifier) => {
      const next = withExtension(specifier, filePath);

      if (next === specifier) return match;
      rewritten++;

      return `${lead}${quote}${next}${quote}`;
    });

    if (output !== source) await fs.writeFile(filePath, output);
  });

  if (unresolved.length > 0) {
    throw new Error(
      `Declaration specifiers that resolve to nothing:\n  ${unresolved.join("\n  ")}`,
    );
  }

  console.log(`   ↳ pinned ${rewritten} relative specifiers to explicit .js paths`);
}

function logComponentCount() {
  const { components } = readComponentDirs(path.join(rootDir, "src/components"));

  console.log(`✅ Found ${components.length} components`);
  console.log("   Note: Component exports are generated during 'pnpm pack' via clean-package");
}

async function measureBundleSizes() {
  console.log("📊 Measuring bundle sizes...");

  const sizes = { components: {}, css: {}, main: {}, total: { gzip: 0, min: 0 } };

  async function measureFile(filePath) {
    if (!(await fs.pathExists(filePath))) return null;

    const content = await fs.readFile(filePath);

    return {
      gzip: (zlib.gzipSync(content, { level: 9 }).length / 1000).toFixed(2),
      min: (Buffer.byteLength(content) / 1000).toFixed(2),
    };
  }

  function addToTotal(size) {
    sizes.total.min += parseFloat(size.min);
    sizes.total.gzip += parseFloat(size.gzip);
  }

  const mainSize = await measureFile(path.join(distDir, "index.js"));

  if (mainSize) {
    sizes.main = mainSize;
    addToTotal(mainSize);
  }

  const componentsDir = path.join(distDir, "components");

  if (await fs.pathExists(componentsDir)) {
    for (const componentDir of await fs.readdir(componentsDir)) {
      const size = await measureFile(path.join(componentsDir, componentDir, "index.js"));

      if (!size) continue;
      sizes.components[componentDir] = size;
      addToTotal(size);
    }
  }

  const stylesSize = await measureFile(path.join(distDir, "styles.css"));

  if (stylesSize) {
    sizes.css.styles = stylesSize;
    addToTotal(stylesSize);
  }

  sizes.total.min = sizes.total.min.toFixed(2);
  sizes.total.gzip = sizes.total.gzip.toFixed(2);

  const sizesPath = path.join(rootDir, "bundle-sizes.json");

  await fs.writeJson(sizesPath, sizes, { spaces: 2 });

  console.log("\n📦 Bundle Size Report");
  console.log("═".repeat(50));
  console.log(`Total: ${sizes.total.min}kb (${sizes.total.gzip}kb gzipped)`);
  console.log("─".repeat(50));

  if (sizes.main.min) {
    console.log(`  index.js: ${sizes.main.min}kb (${sizes.main.gzip}kb gzipped)`);
  }
  if (sizes.css.styles) {
    console.log(`  styles.css: ${sizes.css.styles.min}kb (${sizes.css.styles.gzip}kb gzipped)`);
  }

  const sortedComponents = Object.entries(sizes.components).sort(
    (a, b) => parseFloat(b[1].gzip) - parseFloat(a[1].gzip),
  );

  if (sortedComponents.length > 0) {
    console.log("\n🧩 Components:");
    for (const [component, size] of sortedComponents) {
      console.log(`  ${component}: ${size.min}kb (${size.gzip}kb gzipped)`);
    }
  }

  console.log("═".repeat(50));
  console.log(`\n💾 Size report saved to: ${sizesPath}`);
}

async function main() {
  try {
    const shouldGenerateTypes = process.argv.includes("--tsc");

    await clean();
    await build();
    await buildStyles();

    if (shouldGenerateTypes) {
      await generateTypes();
    } else {
      console.log("⚡ Skipping TypeScript generation (use --tsc to include)");
    }

    logComponentCount();
    await measureBundleSizes();

    console.log("✨ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

await main();
