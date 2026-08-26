import type { RunOptions } from "@ropav/testing/helpers/a11y";

import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";

/**
 * Audits a rendered story with axe, in both colour schemes.
 *
 * The component suites run axe too, but only on the components that have a browser test, and only
 * on the states those tests set up. Half the library never reached one. Running it here instead
 * covers everything that has a story, in the composition the story builds - which is the only place
 * axe's relational rules mean anything: an `option` outside a `listbox` or a `row` outside a `grid`
 * reports a failure that says more about the harness than about the component.
 *
 * The second pass is scheme, not theme. Only `color-contrast` can change with the palette - every
 * other rule reads the DOM, and the DOM is the same under both - so the dark pass runs that rule
 * alone. It also flips the class rather than re-rendering: theming is pure CSS, so the same story
 * answers for both schemes and the pass costs one axe run instead of a second render.
 *
 * What this deliberately does NOT cover is the other ten themes. Contrast is a property of a token
 * pair, not of a story, and re-rendering every story per theme would rediscover the same handful of
 * pairs eleven times over. The token matrix in `packages/styles` checks those pairs directly.
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
 * Flipping the scheme starts a transition on everything that declares one, and axe judges contrast
 * from the value it finds mid-flight - which reads as exactly the failure being looked for. Measured
 * on 60 stories: 88 violations with the transitions running, 7 with them stopped, and the 7 match
 * what a real dark render reports.
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

/** Swaps the scheme class the theme decorator put on the root, and hands back the way home. */
const useDarkScheme = () => {
  const root = document.documentElement;
  const had = [...root.classList];

  root.classList.remove("light");
  root.classList.add("dark");

  return () => {
    root.className = had.join(" ");
  };
};

export const a11yAudit = async ({ canvasElement, parameters }: StoryContext) => {
  const config = parameters?.a11y ?? {};

  if (config.disable) return;

  // A story may narrow what is audited - an overlay renders outside the canvas, a third-party
  // embed is not ours to fix. Anything else stays on the canvas the story actually rendered.
  const target = (config.context ?? canvasElement) as Parameters<typeof expectNoA11yViolations>[0];
  const options = config.options ?? {};
  const resumeMotion = stopMotion();

  try {
    await settle();
    await expectNoA11yViolations(target, options);

    const restoreScheme = useDarkScheme();

    try {
      await settle();
      await expectNoA11yViolations(target, { ...options, runOnly: ["color-contrast"] });
    } catch (error) {
      // Without this the message is indistinguishable from the light pass, and the first thing
      // anyone would do is open the story and fail to reproduce it.
      throw new Error(`In dark mode: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      restoreScheme();
    }
  } finally {
    resumeMotion();
  }
};
