/**
 * Compiles a stylesheet entry into the single file a browser can load on its own.
 *
 * Shared with `packages/ropav`, whose entry is this package's plus its own override layer, so
 * both published packages offer the same artifact built the same way. Reached from there by
 * resolving this package's `package.json`; it never runs from a tarball, only from the repo.
 */
/* eslint-disable no-console */
import { execFileSync } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { createRequire } from "module";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

/**
 * The classes the stylesheet offers by name rather than through a component, read from where
 * they are defined so the safelist below cannot drift from them.
 */
async function authoringUtilities() {
  const source = await readFile(path.join(stylesRoot, "utilities/index.css"), "utf8");
  const names = [...source.matchAll(/^@utility ([a-z-]+)/gm)].map(([, name]) => name);

  if (names.length === 0) throw new Error("No @utility definitions found in utilities/index.css");

  return names;
}

function cliPath() {
  const manifest = require.resolve("@tailwindcss/cli/package.json");

  return path.resolve(path.dirname(manifest), require(manifest).bin.tailwindcss);
}

/**
 * Two things have to be forced here, or the utilities layer fills with whatever class-shaped
 * words the sources happen to contain — `block`, `container`, `truncate`, and in `packages/ropav`
 * every utility its stories name.
 *
 * Automatic source detection roots at the working directory, so the compile runs from an empty
 * one. That leaves nothing detected at all, which is why the classes that *are* offered by name
 * then have to be asked for explicitly.
 *
 * The safelist lives in a wrapper written beside the entry rather than in the entry itself: the
 * entry ships, and a `@source` directive in it would reach into the consumer's own build.
 */
export async function bundleCss({ entry, out }) {
  const wrapper = path.join(path.dirname(entry), ".bundle.css");
  const scratch = await mkdtemp(path.join(tmpdir(), "ropav-bundle-"));
  const safelist = (await authoringUtilities()).join(" ");

  try {
    await writeFile(
      wrapper,
      `@source inline("${safelist}");\n\n@import "./${path.basename(entry)}";\n`,
    );

    execFileSync(process.execPath, [cliPath(), "-i", wrapper, "-o", out, "--minify"], {
      cwd: scratch,
      stdio: "inherit",
    });
  } finally {
    await rm(wrapper, { force: true });
    await rm(scratch, { force: true, recursive: true });
  }
}
