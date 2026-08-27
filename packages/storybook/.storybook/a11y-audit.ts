import type { RunOptions } from "@ropav/testing/helpers/a11y";

import { PALETTE_CONTRAST_DEBT, expectNoA11yViolations } from "@ropav/testing/helpers/a11y";

/**
 * Audits a rendered story with axe.
 *
 * The component suites run axe too, but only on the components that have a browser test, and only
 * on the states those tests set up. Half the library never reached one. Running it here instead
 * covers everything that has a story, in the composition the story builds - which is the only place
 * axe's relational rules mean anything: an `option` outside a `listbox` or a `row` outside a `grid`
 * reports a failure that says more about the harness than about the component.
 *
 * Contrast is deliberately not part of it. `--accent` and `--danger` sit below the AA floor for
 * normal text, and axe has no way to accept two specific colours while still judging the rest, so
 * leaving the rule on here would keep every story that paints with either permanently red.
 *
 * It lives in `ropav`'s token matrix instead, which is the better home for it anyway: a contrast
 * failure is a property of two tokens rather than of the story that happened to pair them, so the
 * matrix checks each pair across all eleven themes and both schemes, names the token when one
 * fails, and lists what it lets through with the measurement beside it. What the matrix cannot do
 * is discover which pairings actually occur - that is this sweep's job. Run it once with the rule
 * on after adding a component, and carry any new pairing across.
 */

type A11yContext = {
  readonly exclude?: unknown;
  readonly include?: unknown;
};

type A11yParameters = {
  readonly context?: A11yContext | string | string[];
  readonly disable?: boolean;
  readonly options?: RunOptions;
};

type StoryContext = {
  readonly canvasElement: HTMLElement;
  readonly parameters?: { readonly a11y?: A11yParameters };
};

/**
 * Colour transitions are why this stops motion before reading anything.
 *
 * A story that transitions on entry reports whatever value axe catches mid-flight, which reads as
 * exactly the kind of failure being looked for. Measured while the audit still flipped schemes: 88
 * violations with the transitions running against 7 with them stopped, on the same 60 stories.
 */
const stopMotion = () => {
  const style = document.createElement("style");

  style.dataset["a11yAudit"] = "";
  style.textContent = `*, *::before, *::after {
    transition: none !important;
    animation: none !important;
  }`;
  document.head.appendChild(style);

  return () => style.remove();
};

const settle = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const a11yAudit = async ({ canvasElement, parameters }: StoryContext) => {
  const config = parameters?.a11y ?? {};

  if (config.disable) return;

  // A story may narrow what is audited - an overlay renders outside the canvas, a third-party
  // embed is not ours to fix. Anything else stays on the canvas the story actually rendered.
  const target = (config.context ?? canvasElement) as Parameters<typeof expectNoA11yViolations>[0];
  const resumeMotion = stopMotion();

  try {
    await settle();
    await expectNoA11yViolations(target, {
      ...config.options,
      rules: { ...PALETTE_CONTRAST_DEBT.rules, ...config.options?.rules },
    });
  } finally {
    resumeMotion();
  }
};
