/**
 * Replaces `@apply` with what it means, and refuses to leave the tree changed unless the compiled
 * stylesheet came out the same.
 *
 *   node scripts/migration/codemod.mjs --files components/button.css,components/chip.css
 *   node scripts/migration/codemod.mjs --all --keep status-disabled
 *   node scripts/migration/codemod.mjs --all --dry
 *
 * `--keep` leaves a statement alone when every utility it names is on the list, for the ones that
 * are becoming a class on the markup instead of a copy in every component.
 *
 * The verification is the reason to run this rather than edit by hand: the whole entry is compiled
 * before and after, and the `components` layer is compared rule by rule. A difference restores
 * every file and reports what moved. Only an empty diff leaves the edit in place.
 */
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  animationLibrary,
  applyStatements,
  classifySlots,
  stylesheets,
  stylesRoot,
} from "./corpus.mjs";
import { normalise, renameSlots } from "./normalise.mjs";
import { compileCss, expandApplyLists } from "./oracle.mjs";
import { compare } from "./verify.mjs";
import { rewrite } from "./writer.mjs";

const argument = (name) => {
  const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));

  return found ? found.slice(name.length + 3) : null;
};

const flag = (name) => process.argv.includes(`--${name}`);

const entry = `@import "${stylesRoot}/index.css";`;

/** The files to rewrite: everything with an `@apply`, or the ones named. */
const targets = () => {
  const named = argument("files");

  if (named) return named.split(",").map((file) => path.resolve(stylesRoot, file.trim()));

  // `utilities/index.css` and `variants/index.css` define Tailwind directives rather than rules,
  // and are the subject of their own step. Everything else with a statement is fair game.
  return stylesheets().filter(
    (file) => !file.endsWith("utilities/index.css") && !file.endsWith("variants/index.css"),
  );
};

const main = () => {
  const keep = new Set((argument("keep") ?? "").split(",").filter(Boolean));
  const files = targets().filter((file) => applyStatements(readFileSync(file, "utf8")).length > 0);

  if (files.length === 0) throw new Error("No file named has an `@apply` left to expand.");

  // Every list in the package, not only the ones being rewritten: the slot classification is only
  // right if it has seen everything that reads a slot.
  const everyList = stylesheets().flatMap((file) =>
    applyStatements(readFileSync(file, "utf8")).map(({ list }) => list),
  );

  console.log(`Expanding ${new Set(everyList).size} distinct lists…`);
  const expanded = expandApplyLists(everyList);
  const table = classifySlots([...expanded.values()].join("\n"), {
    foreign: animationLibrary(),
    owned: stylesheets().map((file) => readFileSync(file, "utf8")),
  });
  const { defer, drop, rename } = table;

  console.log(
    `Slots: dropping ${drop.size} unread, renaming ${rename.size}, leaving ${defer.size} to the animation library.`,
  );

  const before = compileCss(entry);
  const original = new Map(files.map((file) => [file, readFileSync(file, "utf8")]));
  let replaced = 0;

  for (const [file, source] of original) {
    const statements = applyStatements(source);
    const result = rewrite(
      source,
      statements,
      (list) => {
        const held = list.split(/\s+/).every((token) => keep.has(token));

        return held ? null : normalise(expanded.get(list), table);
      },
      (css) => renameSlots(css, table),
    );

    writeFileSync(file, result.css);
    replaced += result.replaced;
  }

  console.log(`Rewrote ${replaced} statements across ${files.length} files.`);

  const after = compileCss(entry);
  /*
   * Both sides, not just the before. The before spells every slot Tailwind's way; the after
   * spells them ropav's way only in the files this run touched, and Tailwind's way in the rest.
   * Normalising both is what puts them in one language, and it is a no-op wherever the codemod
   * has already been.
   */
  const differences = compare(normalise(before, table), normalise(after, table));

  const restore = () => {
    for (const [file, source] of original) writeFileSync(file, source);
  };

  if (differences.length > 0) {
    restore();
    console.error(
      `\n✗ ${differences.length} differences in the components layer. Nothing written.`,
    );
    for (const line of differences.slice(0, 40)) console.error(`  ${line}`);
    process.exit(1);
  }

  console.log(`\n✓ The components layer is unchanged.`);

  if (flag("dry")) {
    restore();
    console.log("  --dry: files restored.");
  }
};

main();
