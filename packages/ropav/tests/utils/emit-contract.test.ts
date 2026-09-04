import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The `update:*` emit contract, checked against the source rather than by driving components.
 *
 * Every stateful component emits `update:<prop>` beside the React-named callback, and that pair is
 * what `v-model:<prop>` runs on. Driving all 56 of them through the DOM would mostly re-test the
 * statement *next to* one an existing callback test already covers — 50 of the 56 emit sites sit
 * within three lines of a sibling `emit("<callback>")` in the same code path, and `defineEmits<{}>`
 * already makes `vue-tsc` reject a misspelled emit name.
 *
 * What a type checker cannot see is a **declared emit that nothing ever raises** — an entry in
 * `defineEmits` (or in a published `*Emits` interface) with no `emit()` behind it. That is a silent
 * hole in the public API, it costs milliseconds to rule out here, and it stays ruled out for emits
 * added later. The six emits that really are the only channel to their component — `Calendar` and
 * `RangeCalendar`, which raise no React-named callback at all — are driven for real in their own
 * suites instead.
 */
const COMPONENTS_DIR = join(import.meta.dirname, "../../src/components");

/** `"update:someProp"` used as a key, i.e. declared rather than raised. */
const DECLARED_KEY = /"(update:[A-Za-z]+)"\s*:/g;
/** `emit("update:someProp"` — the call itself. */
const EMIT_CALL = /emit\(\s*"(update:[A-Za-z]+)"/g;

const matchAll = (source: string, pattern: RegExp) =>
  new Set([...source.matchAll(pattern)].map((match) => match[1]!));

/**
 * The body of every `defineEmits<{ … }>` in a file, so a `"update:x"` key written anywhere else
 * (a prop type, a comment, a string literal) cannot be mistaken for a declaration.
 */
const defineEmitsBlocks = (source: string) => {
  const blocks: string[] = [];
  let from = 0;

  for (;;) {
    const start = source.indexOf("defineEmits<{", from);

    if (start === -1) return blocks;

    const open = start + "defineEmits<".length;
    let depth = 0;
    let index = open;

    for (; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      else if (source[index] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    blocks.push(source.slice(open, index));
    from = index;
  }
};

/** Bodies of the exported `*Emits` interfaces — the contract a consumer reads. */
const publishedEmitsBlocks = (source: string) => {
  const blocks: string[] = [];

  for (const match of source.matchAll(/interface\s+\w*Emits\s*\{/g)) {
    const open = source.indexOf("{", match.index);
    let depth = 0;
    let index = open;

    for (; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1;
      else if (source[index] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    blocks.push(source.slice(open, index));
  }

  return blocks;
};

interface PartEmits {
  /** Declared in this file's `defineEmits`. */
  declared: Set<string>;
  /** Actually raised through `emit()` in this file. */
  emitted: Set<string>;
  /** `dropdown/dropdown-menu.vue`, for a readable failure. */
  path: string;
}

/**
 * One published interface, paired with the SFC it belongs to. `DropdownRootEmits` describes
 * `dropdown-root.vue` alone — comparing it against every emit in the whole `dropdown/` directory
 * would report `DropdownMenu`'s emits as missing from the root's contract.
 */
interface PublishedEmits {
  keys: Set<string>;
  /** The SFC the interface name points at, whether or not it exists. */
  sfc: string;
  interfaceName: string;
}

const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const parts: PartEmits[] = [];
const published: PublishedEmits[] = [];

for (const name of readdirSync(COMPONENTS_DIR)) {
  const dir = join(COMPONENTS_DIR, name);

  if (!statSync(dir).isDirectory()) continue;

  for (const file of readdirSync(dir)) {
    const source = readFileSync(join(dir, file), "utf-8");

    if (file.endsWith(".vue")) {
      const declared = new Set<string>();

      for (const block of defineEmitsBlocks(source)) {
        for (const key of matchAll(block, DECLARED_KEY)) declared.add(key);
      }

      const emitted = matchAll(source, EMIT_CALL);

      if (declared.size > 0 || emitted.size > 0) {
        parts.push({ declared, emitted, path: `${name}/${file}` });
      }
    } else if (file.endsWith(".types.ts")) {
      for (const match of source.matchAll(/interface\s+(\w*)Emits\s*\{/g)) {
        const keys = matchAll(publishedEmitsBlocks(source).join("\n"), DECLARED_KEY);
        const own = new Set(
          [...keys].filter((key) =>
            new RegExp(`interface\\s+${match[1]}Emits\\s*\\{[^}]*"${key}"`, "s").test(source),
          ),
        );

        published.push({
          interfaceName: `${match[1]}Emits`,
          keys: own,
          sfc: `${name}/${kebab(match[1]!)}.vue`,
        });
      }
    }
  }
}

describe("update:* emit contract", () => {
  // Without this the suite passes vacuously the moment a regex stops matching, which is the
  // failure mode a source-reading test is most exposed to.
  it("finds the emits it is supposed to be checking", () => {
    const declared = parts.reduce((total, part) => total + part.declared.size, 0);

    expect(parts.length).toBeGreaterThanOrEqual(30);
    expect(declared).toBeGreaterThanOrEqual(50);
    expect(published.length).toBeGreaterThanOrEqual(5);
  });

  it("raises every update:* the same file declares", () => {
    const unraised = parts.flatMap(({ declared, emitted, path }) =>
      [...declared].filter((key) => !emitted.has(key)).map((key) => `${path}: ${key}`),
    );

    expect(unraised).toEqual([]);
  });

  it("keeps a published *Emits interface in step with the SFC it describes", () => {
    const byPath = new Map(parts.map((part) => [part.path, part]));
    const drifted = published.flatMap(({ interfaceName, keys, sfc }) => {
      const part = byPath.get(sfc);

      // An interface naming an SFC that declares no emits at all is a rename waiting to rot.
      if (!part)
        return keys.size > 0 ? [`${interfaceName} describes ${sfc}, which has no emits`] : [];

      return [
        ...[...keys]
          .filter((key) => !part.declared.has(key))
          .map((key) => `${interfaceName}: ${key} is published but ${sfc} does not declare it`),
        ...[...part.declared]
          .filter((key) => !keys.has(key))
          .map((key) => `${sfc}: ${key} is declared but ${interfaceName} does not publish it`),
      ];
    });

    expect(drifted).toEqual([]);
  });
});
