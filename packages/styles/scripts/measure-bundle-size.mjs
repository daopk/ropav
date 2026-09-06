#!/usr/bin/env node
/* eslint-disable no-console */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const componentsDir = path.join(rootDir, "components");
const outputFile = path.join(rootDir, "bundle-size.json");

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);

    return stats.size;
  } catch {
    return null;
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === null) return "N/A";
  const kb = bytes / 1024;

  return {
    bytes,
    formatted: kb >= 1 ? `${kb.toFixed(2)} KB` : `${bytes} B`,
    kb: Math.round(kb * 1000) / 1000,
  };
}

/**
 * What the file costs on the wire. The raw byte count is the least interesting number about a
 * stylesheet — most of what a stylesheet repeats, a compressor removes.
 */
function getTransferSizes(filePath) {
  const contents = fs.readFileSync(filePath);

  return {
    brotli: zlib.brotliCompressSync(contents).length,
    bytes: contents.length,
    gzip: zlib.gzipSync(contents, { level: 9 }).length,
  };
}

/**
 * Bytes per top-level `@layer`, which is what makes a size change legible: a layer growing
 * because a component gained a rule reads nothing like the theme layer growing.
 */
function getLayerSizes(filePath) {
  const css = fs.readFileSync(filePath, "utf8");
  const layers = {};
  let measuredTo = 0;

  for (const match of css.matchAll(/@layer ([a-z-]+)\{/g)) {
    // A layer nested inside one already measured is part of that layer's own bytes.
    if (match.index < measuredTo) continue;

    let depth = 0;
    let end = match.index + match[0].length - 1;

    for (; end < css.length; end++) {
      if (css[end] === "{") depth++;
      else if (css[end] === "}" && --depth === 0) break;
    }

    measuredTo = end + 1;
    layers[match[1]] = measuredTo - match.index;
  }

  return layers;
}

/**
 * Get sizes for all component CSS files
 */
function getComponentSizes() {
  const components = {};

  if (!fs.existsSync(componentsDir)) {
    return components;
  }

  const files = fs
    .readdirSync(componentsDir)
    .filter((f) => f.endsWith(".css") && f !== "index.css");

  for (const file of files) {
    const filePath = path.join(componentsDir, file);
    const size = getFileSize(filePath);

    if (size !== null) {
      components[file] = {
        bytes: size,
        kb: Math.round((size / 1024) * 1000) / 1000,
      };
    }
  }

  return components;
}

/**
 * Build the CSS bundle
 */
function buildBundle() {
  console.log("Building CSS bundle...");
  try {
    execSync("npm run build", {
      cwd: rootDir,
      stdio: "inherit",
    });
    console.log("Build completed.\n");

    return true;
  } catch (error) {
    console.error("Build failed:", error.message);

    return false;
  }
}

/**
 * Load previous measurement for comparison
 */
function loadPreviousMeasurement() {
  try {
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf-8");

      return JSON.parse(content);
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Calculate and display comparison
 */
function showComparison(current, previous, _) {
  if (!previous) return "";

  const diff = current - previous;
  const percent = ((diff / previous) * 100).toFixed(2);
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  const sign = diff > 0 ? "+" : "";

  return ` (${arrow} ${sign}${formatBytes(diff).formatted}, ${sign}${percent}%)`;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes("--skip-build");
  const compareOnly = args.includes("--compare");

  console.log("=".repeat(60));
  console.log("Ropav CSS Bundle Size Measurement");
  console.log("=".repeat(60));
  console.log();

  // Load previous measurement
  const previous = loadPreviousMeasurement();

  if (compareOnly && previous) {
    console.log("Previous measurement from:", previous.timestamp);
    console.log();
    console.log("Uncompressed (index.css):", formatBytes(previous.uncompressed.bytes).formatted);
    console.log("Minified (ropav.min.css):", formatBytes(previous.minified.bytes).formatted);
    console.log();
    console.log("Component breakdown:");

    const sortedComponents = Object.entries(previous.components).sort(
      (a, b) => b[1].bytes - a[1].bytes,
    );

    for (const [name, size] of sortedComponents.slice(0, 10)) {
      console.log(`  ${name.padEnd(30)} ${formatBytes(size.bytes).formatted}`);
    }
    if (sortedComponents.length > 10) {
      console.log(`  ... and ${sortedComponents.length - 10} more`);
    }

    return;
  }

  // Build unless skipped
  if (!skipBuild) {
    const buildSuccess = buildBundle();

    if (!buildSuccess) {
      process.exit(1);
    }
  }

  // Measure sizes
  const minifiedPath = path.join(distDir, "ropav.min.css");

  if (getFileSize(minifiedPath) === null) {
    console.error("Error: dist/ropav.min.css not found. Run build first.");
    process.exit(1);
  }

  const transfer = getTransferSizes(minifiedPath);
  const minifiedSize = transfer.bytes;
  const layers = getLayerSizes(minifiedPath);
  const components = getComponentSizes();

  // Calculate totals
  const totalComponentBytes = Object.values(components).reduce((sum, c) => sum + c.bytes, 0);

  // Create result object
  const result = {
    components,
    componentsTotal: formatBytes(totalComponentBytes),
    layers,
    minified: formatBytes(minifiedSize),
    timestamp: new Date().toISOString(),
    transfer,
  };

  // Display results
  console.log("Bundle Sizes:");
  console.log("-".repeat(60));
  console.log(
    `Minified (ropav.min.css):   ${result.minified.formatted}${previous ? showComparison(minifiedSize, previous.minified.bytes, "minified") : ""}`,
  );
  console.log(
    `  gzip:                     ${formatBytes(transfer.gzip).formatted}${previous?.transfer ? showComparison(transfer.gzip, previous.transfer.gzip, "gzip") : ""}`,
  );
  console.log(
    `  brotli:                   ${formatBytes(transfer.brotli).formatted}${previous?.transfer ? showComparison(transfer.brotli, previous.transfer.brotli, "brotli") : ""}`,
  );
  console.log(
    `Components total (source):  ${result.componentsTotal.formatted}${previous ? showComparison(totalComponentBytes, previous.componentsTotal?.bytes, "components") : ""}`,
  );
  console.log();

  console.log("Bundle by layer:");
  console.log("-".repeat(60));

  for (const [name, bytes] of Object.entries(layers).sort((a, b) => b[1] - a[1])) {
    const share = ((bytes / minifiedSize) * 100).toFixed(1);

    console.log(
      `  @layer ${name.padEnd(22)} ${formatBytes(bytes).formatted.padStart(12)}  ${share.padStart(5)}%${previous?.layers ? showComparison(bytes, previous.layers[name], name) : ""}`,
    );
  }

  console.log();

  // Component breakdown (top 10 largest)
  console.log("Top 10 Largest Components:");
  console.log("-".repeat(60));

  const sortedComponents = Object.entries(components).sort((a, b) => b[1].bytes - a[1].bytes);

  for (const [name, size] of sortedComponents.slice(0, 10)) {
    const prevSize = previous?.components?.[name]?.bytes;
    const comparison = prevSize ? showComparison(size.bytes, prevSize, name) : "";

    console.log(
      `  ${name.padEnd(30)} ${formatBytes(size.bytes).formatted.padStart(12)}${comparison}`,
    );
  }

  console.log();

  // Save results
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`Results saved to: bundle-size.json`);

  // Summary comparison
  if (previous) {
    console.log();
    console.log("=".repeat(60));
    console.log("Summary vs Previous Measurement");
    console.log("=".repeat(60));

    const minifiedDiff = minifiedSize - previous.minified.bytes;
    const gzipDiff = previous.transfer ? transfer.gzip - previous.transfer.gzip : null;

    console.log(`Previous timestamp: ${previous.timestamp}`);
    console.log(`Current timestamp:  ${result.timestamp}`);
    console.log();
    console.log(
      `Minified change:     ${minifiedDiff > 0 ? "+" : ""}${formatBytes(minifiedDiff).formatted}`,
    );

    // The one that reaches a user. A change to what the stylesheet repeats moves the raw count
    // far more than it moves this.
    if (gzipDiff !== null) {
      console.log(
        `Gzip change:         ${gzipDiff > 0 ? "+" : ""}${formatBytes(gzipDiff).formatted}`,
      );
    }

    if (minifiedDiff < 0) {
      const savedPercent = ((-minifiedDiff / previous.minified.bytes) * 100).toFixed(2);

      console.log();
      console.log(`🎉 Bundle size reduced by ${savedPercent}%!`);
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
