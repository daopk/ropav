# Migration harness

Built to watch one change — the removal of Tailwind from the two published packages — and kept,
because most of it outlived the change. The name is where it came from, not what it is for.

## What is permanent

- **`bundled.browser.test.ts`** — the compiled `dist/ropav.min.css` renders every component rule
  the same as the source it was built from. A compiler follows the imports, lowers what the
  browser floor lacks and rewrites selectors, and any of that can disagree with the file everyone
  reads. Skipped without a build.
- **`reset.browser.test.ts`** — the reset stops at the `rp-` prefix, and does not set the page's
  own font or line height.
- **`exit-keyframe.browser.test.ts`** — a `to`-only keyframe animates towards the slots the
  element is actually carrying. The golden below cannot see this: it stops every animation at
  `t=0`, where such a keyframe equals the resting state.
- **`coverage.browser.test.ts`** — the guard on the harness itself, which fails if the matrix
  stops reaching the `components` layer, or if `renamed.ts` stops describing it.

## The golden

`cases.ts` reads every rule in the `components` layer out of CSSOM — the parsed sheet, because the
layer a rule ended up in is half the question. `selector-dom.ts` builds the smallest DOM each rule
matches, and `matches()` decides whether it succeeded, so a gap in the parser costs coverage and
never produces a case measuring the wrong element. `render.ts` mounts all of them under each mode
and records what the browser resolved, minus what the same tree resolves to with the last
element's own classes and attributes taken off.

That subtraction is what makes a case mean one rule rather than the whole cascade, and it is also
the golden's one structural blind spot: **anything that lands on the reference as well as the
target cancels out.** A page-wide reset is the example that matters — removing Tailwind's
preflight moved every classless reference element and not one component, and the report read as
five thousand regressions. Read `reset.browser.test.ts` and `bundled.browser.test.ts` for the
shape that answers that question instead: mount the two stylesheets in two iframes and compare the
targets directly.

## Freezing and comparing

The golden is **not committed**. It is 5 MB of machine output, several steps of the migration
changed it on purpose, and a file like that gets regenerated to make a suite green rather than
read — which is the failure this harness is supposed to prevent, not cause.

Freeze it from the tree you are changing *away* from:

```bash
VITE_FREEZE_STYLES=1 pnpm --filter ropav exec vitest run --project vue-browser tests/styles/migration -u
```

That writes `__baseline__/computed-styles.json`, which is gitignored. Then make the change and run
the suite normally; the snapshot test reports which cases moved, and by which property, rather
than dumping the file.

## Renaming a selector

A case is keyed by its selector, so rewriting one retires a case and introduces another: the
report gains a `-` and a `+` that no longer name the same rule, and the values that were supposed
to be compared never are. `renamed.ts` maps a selector to the one the baseline was keyed by, and
only the key is substituted — the DOM is still built from the selector the sheet declares, so the
case goes on measuring the element the rule matches. What a rule is called becomes a label, and
the comparison is left holding the values, which is the only part a rename should not move.

Write the key the way CSSOM hands the selector back rather than the way the file spells it; the
quoting inside `[]` is normalised, and nesting arrives resolved through `:is()`. An entry that
matches nothing would do nothing and say nothing, so `coverage.browser.test.ts` holds the table
against the sheet both ways round: no key that names an undeclared selector, and no rename that
lands on an id another rule already answers to — that one costs a case rather than raising, since
the matrix keeps the first case per id.

## Reading the report

Two things to know about reading the report. A line with `|` is a property that moved on a case
both reports name — that is the signal. A line with `+` or `-` is a case id that appeared or
vanished, which is usually the *stylesheet pipeline* regrouping selectors rather than the CSS
changing: Tailwind merged a selector list and dropped an empty rule where plain Vite keeps both,
so switching between them renames hundreds of cases while moving no value at all. When that
happens, the comparison worth running is the two-iframe one, with each sheet's own case set
rendered in both documents.
