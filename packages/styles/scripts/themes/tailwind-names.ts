/**
 * The names Tailwind's own default theme declares, which the compatibility shim must not.
 *
 * Pinned rather than read, because `tailwindcss` is not resolvable from this package — it is a
 * dev dependency of `ropav`, where `token-vocabulary.test.ts` holds this list against the real
 * `tailwindcss/theme.css` in both directions. Read here it would be a dependency this package
 * takes on a toolchain it deliberately no longer runs.
 *
 * They are excluded from the shim because re-declaring them under their bare names on `:root` is
 * the collision the prefix was introduced to end: a consumer's `@theme` and the shim would tie on
 * specificity inside `@layer theme`, and import order would decide whose type scale and spacing
 * step a page got.
 *
 * A file of its own so that `generate.ts` stays swept. `token-prefix.test.ts` reads every tracked
 * file for a bare token name and has to exempt whatever spells one as data; exempting the
 * generator would take its emitted stylesheets out of that sweep with it.
 */
export const TAILWIND_NAMES = new Set([
  "--blur-md",
  "--color-black",
  "--color-white",
  "--container-2xl",
  "--container-lg",
  "--container-md",
  "--container-sm",
  "--container-xl",
  "--container-xs",
  "--default-transition-duration",
  "--default-transition-timing-function",
  "--ease-out",
  "--font-mono",
  "--font-sans",
  "--font-weight-bold",
  "--font-weight-medium",
  "--font-weight-normal",
  "--font-weight-semibold",
  "--leading-relaxed",
  "--radius",
  "--spacing",
  "--text-2xl",
  "--text-2xl--line-height",
  "--text-3xl",
  "--text-3xl--line-height",
  "--text-4xl",
  "--text-4xl--line-height",
  "--text-base",
  "--text-base--line-height",
  "--text-lg",
  "--text-lg--line-height",
  "--text-sm",
  "--text-sm--line-height",
  "--text-xl",
  "--text-xl--line-height",
  "--text-xs",
  "--text-xs--line-height",
  "--tracking-tight",
]);
