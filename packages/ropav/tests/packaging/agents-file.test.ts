import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readComponentDirs } from "../../scripts/component-dirs.mjs";

import { localName, parseStatements } from "./parse-exports";

/*
 * `AGENTS.md` is hand-written prose shipped inside the tarball, where nobody looks at it again.
 * A rule naming a part that has since been renamed is worse than no rule at all, so the snippets
 * are held to the names the barrels actually export.
 */

const rootDir = path.resolve(import.meta.dirname, "../..");
const agentsFile = path.join(rootDir, "AGENTS.md");
const source = fs.readFileSync(agentsFile, "utf8");

const { components } = readComponentDirs(path.join(rootDir, "src/components"));

const exported = new Set(
  components.flatMap((name) =>
    parseStatements(fs.readFileSync(path.join(rootDir, "src/components", name, "index.ts"), "utf8"))
      .filter((statement) => statement.isExport && !statement.isTypeOnly)
      .flatMap((statement) => statement.specifiers.map(localName)),
  ),
);

/** Only the fenced Vue blocks. The prose names `DropdownItem` in order to say it does not exist. */
const tags = [...source.matchAll(/```vue\n([\s\S]*?)```/g)].flatMap(([, block]) =>
  [...(block ?? "").matchAll(/<([A-Z]\w*)/g)].map(([, tag]) => tag!),
);

describe("AGENTS.md", () => {
  it("is listed in the published files", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")) as {
      files: string[];
    };

    expect(manifest.files).toContain("AGENTS.md");
  });

  it("has snippets to check", () => {
    expect(tags.length).toBeGreaterThan(0);
  });

  it("only names parts the package exports", () => {
    expect([...new Set(tags)].filter((tag) => !exported.has(tag))).toEqual([]);
  });
});
