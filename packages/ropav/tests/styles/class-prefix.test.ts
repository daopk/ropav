import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Every name the component layer puts into a document-global namespace carries the prefix.
 *
 * A bare `.menu` or `.card` is not ours alone: a host page whose own markup already wears that
 * name inherits the component's rules. Ours sit in `components`, so an unlayered host rule wins
 * every property it declares — and what leaks is everything it left at the initial value, which
 * is the half nobody wrote down. Enumerating the host's names cannot fix that; only not claiming
 * them can.
 *
 * Class names are the large namespace, but not the only one. Keyframes and view-transition
 * classes are global to the document too, and collide the same way.
 *
 * The prefix lives here, once. Changing it is this constant plus a rename across the two layers
 * the check covers.
 */
const PREFIX = "rp-";

const STYLES = path.resolve(import.meta.dirname, "../../../styles");
const COMPONENTS = path.join(STYLES, "components");

const componentFiles = readdirSync(COMPONENTS).filter(
  (file) => file.endsWith(".css") && file !== "index.css",
);

/** Neither a comment nor an `@apply` argument is a place a class selector lives. */
const selectorsOnly = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@apply[^;]*;/g, "");

const offenders = (css: string, pattern: RegExp) =>
  [...selectorsOnly(css).matchAll(pattern)]
    .map((match) => match[1]!)
    .filter((name) => !name.startsWith(PREFIX));

describe("component class names", () => {
  it.each(componentFiles)("%s claims no unprefixed name", (file) => {
    const css = readFileSync(path.join(COMPONENTS, file), "utf8");

    expect({
      classes: offenders(css, /\.([a-zA-Z][a-zA-Z0-9_-]*)/g),
      keyframes: offenders(css, /@keyframes\s+([a-zA-Z][a-zA-Z0-9_-]*)/g),
      viewTransitions: offenders(css, /view-transition-class:\s*([a-zA-Z][a-zA-Z0-9_-]*)/g),
    }).toEqual({ classes: [], keyframes: [], viewTransitions: [] });
  });
});

/**
 * The recipes are the other half. A class the CSS spells and a recipe does not is dead styling;
 * one the recipe spells and the CSS does not renders unstyled — so both layers have to move
 * together, and only this side can be read without a browser.
 */
const recipeDir = path.join(STYLES, "src/components");

const recipeFiles = readdirSync(recipeDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.name.endsWith(".styles.ts"))
  .map((entry) => path.join(entry.parentPath, entry.name));

/**
 * Read structurally rather than by pattern. A recipe's class names are indistinguishable from its
 * variant names by shape — `"default"` is a class under `variants`, a selection under
 * `defaultVariants` — so only position tells them apart, and a check that guesses would pass a
 * bare `base: "card"` straight through.
 */
const emittedClasses = (file: string) => {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const classes: string[] = [];

  const readValue = (node: ts.Node) => {
    if (ts.isStringLiteral(node)) classes.push(...node.text.split(/\s+/).filter(Boolean));
    // A variant option may map slot -> class string.
    else if (ts.isObjectLiteralExpression(node))
      for (const p of node.properties) if (ts.isPropertyAssignment(p)) readValue(p.initializer);
  };

  const entries = (node: ts.Node, depth: number) => {
    if (!ts.isObjectLiteralExpression(node)) return;

    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) continue;

      if (depth > 0) entries(p.initializer, depth - 1);
      else readValue(p.initializer);
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "tv") {
      const [config] = node.arguments;

      if (config && ts.isObjectLiteralExpression(config))
        for (const prop of config.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;

          const key = prop.name.getText(source);

          if (key === "base") readValue(prop.initializer);
          // A slot's value is a class string; a variant's is one level deeper.
          if (key === "slots") entries(prop.initializer, 0);
          if (key === "variants") entries(prop.initializer, 1);
        }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);

  return classes;
};

describe("variant recipes", () => {
  it.each(recipeFiles.map((file) => [path.basename(file), file] as const))(
    "%s emits only prefixed names",
    (_name, file) => {
      expect(emittedClasses(file).filter((token) => !token.startsWith(PREFIX))).toEqual([]);
    },
  );
});

/**
 * The prefix belongs to a class name and to nothing else.
 *
 * A rename that walks the source turning `name` into `rp-name` cannot tell the two apart by shape:
 * `{{ item.label }}` in a story's template is the same word as `.label` in a stylesheet. Prefixing
 * the property leaves `item.rp-label`, which the template compiler reads as `item.rp - label` —
 * valid JavaScript, both halves undefined, so the expression is NaN and the story quietly renders
 * the string "NaN" where the label belongs.
 *
 * Nothing downstream notices. It compiles, it mounts, and the story audit sees a well-formed
 * accessible name that happens to read NaN, so only a check on the source catches it.
 */
const SOURCE = path.resolve(import.meta.dirname, "../../src");

const sourceFiles = readdirSync(SOURCE, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(?:ts|vue)$/.test(entry.name))
  .map((entry) => path.join(entry.parentPath, entry.name));

/**
 * Read the whole token before the dot rather than the character in front of it. A compound
 * selector puts an identifier-and-dot ahead of the prefix too — `.rp-badge--primary.rp-badge--soft`
 * ends in exactly the shape being looked for — and those are written out in doc comments, so a
 * check that stopped at the dot would fail on one.
 */
const readsAsSelector = (text: string, start: number) => {
  let index = start;

  while (index > 0 && /[\w-]/.test(text[index - 1]!)) index--;

  return text[index - 1] === "." && text.slice(index, start).startsWith(PREFIX);
};

const propertyAccess = new RegExp(String.raw`[A-Za-z_$][\w$]*\.${PREFIX}[\w-]+`, "g");

describe("prefixed property accesses", () => {
  it("no source file reads a property by a class name", () => {
    const offenders = sourceFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");

      return [...text.matchAll(propertyAccess)]
        .filter((match) => !readsAsSelector(text, match.index))
        .map((match) => `${path.relative(SOURCE, file)}: ${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });
});
