/**
 * The pass condition: the compiled stylesheet is the same stylesheet.
 *
 * Both sides are compiled by Tailwind — before the edit it is resolving `@apply`, after it is
 * passing declarations through — so anything that differs is something the codemod decided, and
 * the codemod is not supposed to decide anything. The normalisation table is applied to the
 * *before* as well, which is what makes an empty diff mean "identical" rather than "identical
 * apart from the rename we did on purpose".
 *
 * Rules are keyed by their conditions and selector, and compared as a set of declarations rather
 * than as text: Tailwind is free to reorder or re-split, and neither changes what an element
 * computes to. What it is not free to do is drop one, change a value, or move a rule between
 * layers — and those are what this reports.
 */
import postcss from "postcss";

/** The at-rules a rule sits under, outermost first, ignoring layers. */
const conditionsOf = (rule) => {
  const conditions = [];

  for (let at = rule.parent; at && at.type !== "root"; at = at.parent) {
    if (at.type === "atrule" && at.name !== "layer") conditions.unshift(`@${at.name} ${at.params}`);
    if (at.type === "rule") conditions.unshift(at.selector);
  }

  return conditions;
};

const layerOf = (rule) => {
  for (let at = rule.parent; at && at.type !== "root"; at = at.parent) {
    if (at.type === "atrule" && at.name === "layer" && at.params) return at.params;
  }

  return "(unlayered)";
};

/** `key -> sorted "prop: value"` for every rule in one layer. */
export const declarationMap = (css, layer = "components") => {
  const map = new Map();

  postcss.parse(css).walkRules((rule) => {
    if (layerOf(rule) !== layer) return;
    if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;

    const key = [...conditionsOf(rule), rule.selector].join(" >> ");
    const declarations = (rule.nodes ?? [])
      .filter((node) => node.type === "decl")
      .map((node) => `${node.prop}: ${node.value}`);

    // A selector can be written twice; the element sees the union in source order.
    map.set(key, [...(map.get(key) ?? []), ...declarations]);
  });

  for (const [key, declarations] of map) map.set(key, [...declarations].sort());

  return map;
};

/** Every way two compiled stylesheets disagree about the layer. */
export const compare = (before, after, layer = "components") => {
  const was = declarationMap(before, layer);
  const now = declarationMap(after, layer);
  const lines = [];

  for (const key of new Set([...was.keys(), ...now.keys()])) {
    const a = was.get(key);
    const b = now.get(key);

    if (!a) {
      lines.push(`+ rule  ${key}`);
      continue;
    }
    if (!b) {
      lines.push(`- rule  ${key}`);
      continue;
    }
    for (const declaration of a)
      if (!b.includes(declaration)) lines.push(`- ${key} | ${declaration}`);
    for (const declaration of b)
      if (!a.includes(declaration)) lines.push(`+ ${key} | ${declaration}`);
  }

  return lines.sort();
};
