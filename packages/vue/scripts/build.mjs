/* eslint-disable no-console */
import {execSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import zlib from "node:zlib";

import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

/** Directories under `src/components` that are not components */
const SKIP_DIRS = new Set(["icons", "utils", "composables"]);

async function clean() {
  console.log("🧹 Cleaning dist directory...");
  await fs.remove(distDir);
}

async function build() {
  console.log("📦 Building with Vite (library mode)...");
  execSync("vite build", {cwd: rootDir, stdio: "inherit"});
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
        baseUrl: ".",
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
        paths: {"@/*": ["./src/*"]},
        resolveJsonModule: true,
        rootDir: "./src",
        skipLibCheck: true,
        strict: true,
        target: "ESNext",
        verbatimModuleSyntax: true,
      },
      exclude: ["node_modules", "**/*.stories.*", "**/*.test.*", "dist"],
      include: ["src"],
    },
    {spaces: 2},
  );

  try {
    execSync("vue-tsc --project tsconfig.build.json", {cwd: rootDir, stdio: "inherit"});
    console.log("✅ TypeScript declarations generated successfully");
  } finally {
    await fs.remove(tsconfigPath);
  }
}

async function logComponentCount() {
  const componentsDir = path.join(rootDir, "src/components");
  let count = 0;

  if (await fs.pathExists(componentsDir)) {
    for (const item of await fs.readdir(componentsDir)) {
      if (SKIP_DIRS.has(item)) continue;

      const itemPath = path.join(componentsDir, item);

      if (!(await fs.stat(itemPath)).isDirectory()) continue;
      if (await fs.pathExists(path.join(itemPath, "index.ts"))) count++;
    }
  }

  console.log(`✅ Found ${count} components`);
  console.log("   Note: Component exports are generated during 'pnpm pack' via clean-package");
}

async function measureBundleSizes() {
  console.log("📊 Measuring bundle sizes...");

  const sizes = {components: {}, css: {}, main: {}, total: {gzip: 0, min: 0}};

  async function measureFile(filePath) {
    if (!(await fs.pathExists(filePath))) return null;

    const content = await fs.readFile(filePath);

    return {
      gzip: (zlib.gzipSync(content, {level: 9}).length / 1000).toFixed(2),
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

  await fs.writeJson(sizesPath, sizes, {spaces: 2});

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

    await logComponentCount();
    await measureBundleSizes();

    console.log("✨ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

main();
