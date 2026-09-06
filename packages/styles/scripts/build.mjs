#!/usr/bin/env node
/* eslint-disable no-console */
import { execSync } from "child_process";
import { rm } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { bundleCss } from "./bundle-css.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

async function clean() {
  console.log("🧹 Cleaning dist directory...");
  await rm(distDir, { force: true, recursive: true });
}

async function build() {
  console.log("📦 Building with Rolldown...");
  execSync("rolldown -c rolldown.config.ts", { cwd: rootDir, stdio: "inherit" });
}

async function generateTypes() {
  console.log("📝 Generating TypeScript declarations...");
  execSync("tsc --emitDeclarationOnly --project tsconfig.build.json", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("✅ TypeScript declarations generated");
}

async function copyCss() {
  console.log("🎨 Copying CSS files...");
  execSync("node scripts/copy-css.mjs", { cwd: rootDir, stdio: "inherit" });
}

async function minifyCss() {
  console.log("🗜️  Bundling CSS...");
  await bundleCss({
    entry: path.join(distDir, "index.css"),
    out: path.join(distDir, "ropav.min.css"),
  });
}

async function main() {
  try {
    // Check if --tsc flag is passed
    const shouldGenerateTypes = process.argv.includes("--tsc");

    await clean();
    await build();

    if (shouldGenerateTypes) {
      await generateTypes();
    } else {
      console.log("⚡ Skipping TypeScript generation (use --tsc to include)");
    }

    await copyCss();
    await minifyCss();

    console.log("✨ Build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

await main();
