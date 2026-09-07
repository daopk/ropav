#!/usr/bin/env node
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log("Copying CSS files to dist...");

// Helper function to recursively copy CSS files
const copyCssDirectory = (dirName) => {
  const srcDirPath = path.join(rootDir, dirName);
  const distDirPath = path.join(distDir, dirName);

  if (!fs.existsSync(srcDirPath)) {
    return;
  }

  // Create directory in dist
  if (!fs.existsSync(distDirPath)) {
    fs.mkdirSync(distDirPath, { recursive: true });
  }

  // Read all files in the directory
  const files = fs.readdirSync(srcDirPath);

  for (const file of files) {
    const srcFilePath = path.join(srcDirPath, file);
    const distFilePath = path.join(distDirPath, file);
    const stat = fs.statSync(srcFilePath);

    if (stat.isDirectory()) {
      // Recursively copy subdirectories
      copyCssDirectory(path.join(dirName, file));
    } else if (file.endsWith(".css")) {
      // Copy CSS files
      fs.copyFileSync(srcFilePath, distFilePath);
      console.log(`✓ Copied: ${path.join(dirName, file)}`);
    }
  }
};

/*
 * The root stylesheets, read off the directory rather than listed.
 *
 * A list here was three names long and silently skipped anything missing, so adding a fourth root
 * file left the entry importing something `dist/` did not have — which surfaces as a resolver
 * error from inside the bundler, several steps away from the cause.
 */
for (const file of fs.readdirSync(rootDir)) {
  if (!file.endsWith(".css") || file.startsWith(".")) continue;
  fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  console.log(`✓ Copied: ${file}`);
}

// Copy all CSS files from these directories
const directories = ["base", "components", "themes", "utilities", "variants"];

for (const dir of directories) {
  copyCssDirectory(dir);
}

console.log("✅ CSS files copied successfully!");
