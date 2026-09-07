import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { expect, it } from "vitest";

/**
 * No SFC explains itself inside its `<template>`.
 *
 * The Vapor compiler treats an HTML comment as content, because in a template it is: it lands in
 * `_template()` and becomes a real comment node in the DOM. So a note written where it is most
 * useful to read is a note shipped to everyone who renders the component, and one written above
 * the root element costs the component its single root — which is what decides whether a scope id
 * reaches it and whether an attribute falls through to it.
 *
 * None of that shows up in a test that asserts on the elements. The comment is a sibling of the
 * root, not a change to it, so a suite can pass over a component that has quietly become
 * multi-root. Hence a source check: the explanation belongs in the script block a few lines above,
 * where it reads the same and compiles to nothing.
 */
const SOURCE = join(import.meta.dirname, "../../src");

const sfcs = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) return sfcs(path);

    return path.endsWith(".vue") ? [path] : [];
  });

/**
 * The template block, delimited by the tags in the first column.
 *
 * A `v-slot` template is indented, so anchoring to the line start is what keeps the outer block's
 * end from being read off an inner one — and reading the *last* closing tag is what keeps the
 * inner one from ending the search early.
 */
const templateOf = (source: string): string => {
  const open = /^<template>\n/m.exec(source);
  const closes = [...source.matchAll(/^<\/template>/gm)];

  if (!open || closes.length === 0) return "";

  return source.slice(open.index + open[0].length, closes.at(-1)!.index);
};

it("keeps its explanations out of the markup, where they would be rendered", () => {
  const offenders = sfcs(SOURCE)
    .filter((file) => templateOf(readFileSync(file, "utf8")).includes("<!--"))
    .map((file) => file.slice(SOURCE.length + 1));

  expect(offenders).toEqual([]);
});
