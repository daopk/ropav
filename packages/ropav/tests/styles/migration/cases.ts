/**
 * One case per rule in the `components` layer, read out of the stylesheet the browser parsed.
 *
 * CSSOM rather than the file: the layer a rule landed in is the question the snapshot exists to
 * answer, and only the parsed sheet knows it. It also means the matrix follows the stylesheet
 * automatically — a rule added during the migration is a case, without anyone listing it.
 */

import { splitTopLevel } from "./selector-dom";

/** A rule to render, and the conditions it renders under. */
export interface Case {
  /** `@media` / `@supports` preludes wrapping the rule, outermost first. */
  conditions: string[];
  /** Stable across runs, and stable under reordering — the snapshot is keyed by it. */
  id: string;
  selector: string;
}

const isStyleRule = (rule: CSSRule): rule is CSSStyleRule =>
  rule.constructor.name === "CSSStyleRule";

const isLayerBlock = (rule: CSSRule): rule is CSSLayerBlockRule =>
  rule.constructor.name === "CSSLayerBlockRule";

const isGrouping = (rule: CSSRule): rule is CSSGroupingRule =>
  "cssRules" in rule && rule.cssRules instanceof CSSRuleList;

/**
 * Resolves a nested selector against its parent, the way the browser does before matching.
 *
 * CSSOM hands back what was authored — `&:hover`, or a bare `.rp-icon` standing for a descendant
 * — so a nested rule read straight off the sheet names an element that does not exist on its own.
 */
const resolveNesting = (child: string, parent: string): string => {
  const scope = `:is(${parent})`;

  return splitTopLevel(child, ",")
    .map((part) => (part.includes("&") ? part.replaceAll("&", scope) : `${scope} ${part}`))
    .join(", ");
};

/** Walks a sheet, carrying the nearest enclosing layer and the conditions above each rule. */
const walk = (
  rules: CSSRuleList,
  layer: string,
  conditions: string[],
  parent: string,
  visit: (selector: string, layer: string, conditions: string[]) => void,
) => {
  for (const rule of rules) {
    if (isLayerBlock(rule)) {
      walk(rule.cssRules, rule.name || layer, conditions, parent, visit);
      continue;
    }
    if (rule.constructor.name === "CSSKeyframesRule") continue;

    if (isStyleRule(rule)) {
      const selector = parent ? resolveNesting(rule.selectorText, parent) : rule.selectorText;

      visit(selector, layer, conditions);
      if (rule.cssRules.length) walk(rule.cssRules, layer, conditions, selector, visit);
      continue;
    }
    if (isGrouping(rule)) {
      const prelude =
        "conditionText" in rule ? String(rule.conditionText) : rule.cssText.split("{")[0]!.trim();

      walk(rule.cssRules, layer, [...conditions, prelude], parent, visit);
    }
  }
};

/** Every rule the `components` layer declares, deduplicated by selector and conditions. */
export const componentCases = (sheets: StyleSheetList, layerName = "components"): Case[] => {
  const seen = new Map<string, Case>();

  for (const sheet of sheets) {
    let rules: CSSRuleList;

    try {
      rules = (sheet as CSSStyleSheet).cssRules;
    } catch {
      continue; // A cross-origin sheet has no readable rules, and carries none of ours.
    }

    walk(rules, "", [], "", (selector, layer, conditions) => {
      if (layer !== layerName) return;

      const id = [...conditions, selector].join(" ");

      if (!seen.has(id)) seen.set(id, { conditions, id, selector });
    });
  }

  return [...seen.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
};
