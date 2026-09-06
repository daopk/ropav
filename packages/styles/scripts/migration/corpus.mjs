/**
 * Finding the `@apply` statements, and deciding which `--tw-*` slots may be dropped.
 *
 * Both answers come from reading the whole package rather than from a list kept by hand. A list
 * would be right the day it was written: the corpus is the thing that changes.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const stylesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * One `@apply` statement, and exactly where it sits.
 *
 * The offsets are the point. The writer splices the byte range and leaves the rest of the file
 * untouched, because these stylesheets carry more comment than rule and a round-trip through any
 * printer would flatten all of it.
 */
export const applyStatements = (source) => {
  // A comment can contain the word, and several do. Blank them for the scan, keeping offsets.
  const scannable = source.replace(/\/\*[\s\S]*?\*\//g, (block) => " ".repeat(block.length));
  const found = [];

  for (const match of scannable.matchAll(/^([ \t]*)@apply ([^;\n]+);[ \t]*$/gm)) {
    found.push({
      end: match.index + match[0].length,
      indent: match[1],
      list: match[2].trim(),
      start: match.index,
    });
  }

  return found;
};

/** Every stylesheet the package authors, in a stable order. */
export const stylesheets = (dir = stylesRoot) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !file.includes(`${path.sep}dist${path.sep}`))
    .filter((file) => !file.includes("node_modules"))
    .sort();

const readsIn = (css) =>
  new Set([...css.matchAll(/var\(\s*(--tw-[\w-]+)/g)].map(([, name]) => name));

/**
 * Sorts every slot into what the table should do with it.
 *
 * - **drop** — written by the expansion and read by nothing. Residue, not composition.
 * - **rename** — everything else. Both ends are ours, so both ends move together.
 *
 * There used to be a third answer, for a slot read by a stylesheet this package does not write:
 * renaming one half of such a pair is not a rename but a disconnection, so those kept Tailwind's
 * spelling. The animation library was the only thing that ever put a slot in that set, and its
 * keyframes are this package's own now.
 *
 * `owned` must be every stylesheet that ships from this package, or a slot that composes gets
 * read as residue and dropped — the one way this can be quietly wrong.
 */
export const classifySlots = (expansion, { owned }) => {
  const ours = new Set([...readsIn(expansion), ...owned.flatMap((css) => [...readsIn(css)])]);
  const written = new Set(
    [...expansion.matchAll(/(?:^|[\s{;])(--tw-[\w-]+)\s*:/gm)].map(([, n]) => n),
  );

  const drop = new Set([...written].filter((name) => !ours.has(name)));
  const rename = new Set([...ours, ...written].filter((name) => !drop.has(name)));

  return { drop, rename };
};
