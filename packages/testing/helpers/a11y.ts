import type { ElementContext, Result, RunOptions } from "axe-core";

import axe from "axe-core";

// Re-exported so a caller can type its own options without taking a direct dependency on axe.
export type { RunOptions } from "axe-core";

/**
 * Run axe against a DOM subtree and return whatever it flags.
 *
 * Browser-only. axe needs real layout and computed styles to judge contrast, visibility
 * and focusability, none of which jsdom provides — call this from `*.browser.test.*`.
 *
 * `axe-core` directly rather than `@axe-core/playwright`: that package drives a Node-side
 * Playwright `Page`, and Vitest browser tests run inside the browser, where no such
 * object exists.
 */
export const findA11yViolations = async (
  context: ElementContext,
  options: RunOptions = {},
): Promise<Result[]> => {
  const results = await axe.run(context, options);

  return results.violations;
};

/**
 * The contrast failures that belong to the palette rather than to any component.
 *
 * Measured across every theme: `--accent` pairs with `--accent-foreground` at 3.59:1 and
 * `--danger` with the page at 3.27:1, both under the 4.5:1 WCAG AA floor for normal text. They come
 * from `@ropav/styles`, so every component that paints with them inherits the finding and none of
 * them can fix it.
 *
 * Switched off here, in one place, so the debt has a name. Reaching for `{rules: {"color-contrast":
 * ...}}` inline is how the previous version of this drifted into three different shapes.
 */
export const PALETTE_CONTRAST_DEBT: RunOptions = {
  rules: { "color-contrast": { enabled: false } },
};

const formatViolations = (violations: Result[]) =>
  violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `      ${node.html}`).join("\n");

      return `  [${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}\n${nodes}`;
    })
    .join("\n");

/**
 * Fail the test if axe flags anything in the subtree.
 *
 * A safety net, not a substitute for the manual keyboard checklist: automated tooling
 * covers roughly a third of the WCAG success criteria, and catches none of focus order,
 * focus visibility, or meaningful sequence.
 */
export const expectNoA11yViolations = async (
  context: ElementContext,
  options: RunOptions = {},
): Promise<void> => {
  const violations = await findA11yViolations(context, options);

  if (violations.length === 0) return;

  throw new Error(
    `Found ${violations.length} accessibility violation(s):\n${formatViolations(violations)}`,
  );
};
