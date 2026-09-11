/**
 * The name a rule was keyed by before its selector was rewritten.
 *
 * The golden joins two runs by `id`, and `id` is built from the selector — so rewriting a
 * selector retires one case and introduces another, and the report says a rule vanished and an
 * unrelated one appeared in its place. That is the failure `README.md` warns about: a page of
 * `+` and `-` with no `|` among them, nothing to read but whether the count looks plausible.
 * A rename is the change that most needs the golden and least survives it.
 *
 * An entry here says the two are one rule. The key is the selector as CSSOM reports it today; the
 * value is the selector the frozen baseline was keyed by. Only the id is substituted — `selector`
 * stays as the sheet declares it, so the case goes on building the element the rule matches and
 * measuring what it paints. That is the whole point: what a rule is called becomes a label, and
 * the comparison is left holding the values.
 *
 * The key has to be spelled the way CSSOM hands it back rather than the way the file writes it —
 * `[data-variant="soft"]`, quoted and double-quoted, whatever the source used. An entry naming a
 * selector no rule declares would be a no-op, and a silent one; `coverage.browser.test.ts` fails
 * on it instead.
 */
export type Renamed = Record<string, string>;

/** A codemod that renames selectors writes its map here; entries above it are written by hand. */
export const RENAMED: Renamed = {
  // The rule did not move, it narrowed: the resize cursor now excludes the disabled rail rather
  // than outweighing it. Same declaration, same element measured — only the name is longer.
  '.rp-sidebar__rail--resizable:not([data-disabled="true"])': ".rp-sidebar__rail--resizable",

  // Narrowed rather than moved: the trigger's hover fill now stands down while the clear button
  // inside it is the thing being hovered, so the two do not both light up. Same declarations.
  ':is(.rp-select__trigger):hover:not(:has(.rp-select__clear-button:hover)), :is(.rp-select__trigger)[data-hovered="true"]:not(:has(.rp-select__clear-button:hover))':
    ':is(.rp-select__trigger):hover, :is(.rp-select__trigger)[data-hovered="true"]',
};
