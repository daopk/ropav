/**
 * The Storybook index: one entry per story file, so the component list can name what exists
 * without anybody retyping it.
 *
 * The title is read from the file rather than guessed from the path — it is what Storybook
 * itself sorts by, and it carries the category a component was filed under.
 */

import type { StoryEntry } from "../types";

import { existsSync, globSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import ts from "typescript";

import { DOCS, emit, HEADER, SRC } from "./shared";

/**
 * Storybook's own transform, copied from `storybook@10.6.0`
 * (`dist/_browser-chunks/chunk-NULBREPZ.js`). An id built any other way points at nothing.
 */
const sanitize = (string: string): string =>
  string
    .toLowerCase()
    // oxlint-disable-next-line no-useless-escape -- kept character-for-character from the source
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

/** A story counts as ready when its title starts with `Components`, as Storybook's own filter does. */
const READY = /^Components\//;

/**
 * Read structurally. Every story file assigns an object to a `meta` binding and default-exports
 * it, and the `title` a pattern would find first is as likely to belong to a story's args as to
 * the meta — `argTypes` alone puts three nested braces in the way.
 */
const title = (file: string): string | undefined => {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let found: string | undefined;

  const visit = (node: ts.Node): void => {
    if (found) return;

    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          ts.isIdentifier(property.name) &&
          property.name.text === "title" &&
          ts.isStringLiteral(property.initializer)
        ) {
          found = property.initializer.text;

          return;
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  // Only the default-exported binding, so a title nested in a story never stands in for it.
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "meta" &&
        declaration.initializer
      ) {
        visit(declaration.initializer);
      }
    }
  }

  return found;
};

export const emitStories = (): number => {
  const entries: StoryEntry[] = [];

  for (const file of globSync(join(SRC, "components", "*", "*.stories.ts"))) {
    const found = title(file);

    if (!found || !READY.test(found)) continue;

    const segments = found.split("/");
    const dir = basename(dirname(file));

    entries.push({
      category: segments.length > 2 ? segments.slice(1, -1).join("/") : "",
      dir,
      hasPage: existsSync(join(DOCS, "components", `${dir}.md`)),
      id: `${sanitize(found)}--docs`,
      name: segments.at(-1)!,
      title: found,
    });
  }

  entries.sort((a, b) => a.title.localeCompare(b.title));

  emit(
    "stories.ts",
    `${HEADER}

import type { StoryEntry } from "../types.ts";

export const stories: readonly StoryEntry[] = ${JSON.stringify(entries, null, 2)};
`,
  );

  return entries.length;
};
