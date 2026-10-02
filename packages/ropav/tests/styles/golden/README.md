# The golden

Renders every rule in the `components` layer, reads back what the cascade resolved, and compares
that against a frozen run. Built to watch one change — the removal of Tailwind from the two
published packages — and kept, because the engine outlived the change and is now what several
tests are written on.

## What is here

- **`selector-dom.ts`, `cases.ts`, `renamed.ts`, `render.ts`, `report.ts`** — the engine. Imported
  from outside this directory too: `../variant-reach.browser.test.ts`,
  `../exit-keyframe.browser.test.ts` and `../compiled-parity.browser.test.ts` all build their
  cases with it.
- **`computed-styles.browser.test.ts`** — the golden itself.
- **`coverage.browser.test.ts`** — the guard on the engine, which fails if the matrix stops
  reaching the `components` layer, or if `renamed.ts` stops describing it.
- **`report.test.ts`** — the guard on the summary the golden fails with. The golden only compares
  where a baseline was frozen, so nothing else would notice the summary stop saying what moved.

The tests that only *use* the engine live beside their peers in `../`, not here.

## How a case is built, and what it means

`cases.ts` reads every rule in the `components` layer out of CSSOM — the parsed sheet, because the
layer a rule ended up in is half the question. `selector-dom.ts` builds the smallest DOM each rule
matches, and `matches()` decides whether it succeeded, so a gap in the parser costs coverage and
never produces a case measuring the wrong element. `render.ts` mounts all of them under each mode
and records what the browser resolved, minus what the same tree resolves to with the last
element's own classes and attributes taken off.

That subtraction is what makes a case mean one rule rather than the whole cascade, and it is also
the golden's one structural blind spot: **anything that lands on the reference as well as the
target cancels out.** A page-wide reset is the example that matters — removing one moved every
classless reference element and not one component, and the report read as five thousand
regressions. Read `../reset.browser.test.ts` and `../compiled-parity.browser.test.ts` for the
shape that answers that question instead: mount the two stylesheets in two iframes and compare the
targets directly.

## Freezing and comparing

The golden is **not committed**. It is 5 MB of machine output, several steps of the migration
changed it on purpose, and a file like that gets regenerated to make a suite green rather than
read — which is the failure this harness is supposed to prevent, not cause.

Freeze it from the tree you are changing *away* from:

```bash
VITE_FREEZE_STYLES=1 pnpm --filter ropav exec vitest run --project vue-browser tests/styles/golden -u
```

That writes `__baseline__/computed-styles.json`, which is gitignored. Then make the change and run
the suite normally; the snapshot test reports which values moved and by which property, and which
cases came or went, rather than dumping the file.

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

The golden fails with a summary rather than with every line, because a step that moves a thousand
values does not fit in a terminal. `summarise` in `report.ts` builds it, in three parts kept apart
because they are different findings.

`changed` is a property that moved on a case both reports name — that is the signal, and the only
part that compares two values. It counts the cases and the values that moved, counts the values by
property, and gives the first line that moved each property, for a dozen properties at most, as
`mode id | property: from -> to`. One line per property rather than the first ten lines, because
sorted, the first ten are whatever selector sorts first, which routinely means ten copies of one
finding while a different one further down goes unread.

`added` and `removed` are case ids only one report names, and nothing was compared for them. Each
counts its cases and names them, the first forty and then how many more. An id is named once
rather than once per mode: a case is built the same under every mode, so it comes or goes in all
four together. One that came or went in only some keeps those modes, as `mode id`, and that is a
finding of its own.

Two things put an id there. A rule was genuinely added or removed, which the diff already tells
you, and the list says whether the golden saw the same rules come and go. Or a selector was
rewritten, and the case it was keyed by retired while an unrelated-looking one arrived — that is
what `renamed.ts` is for, and an id under `removed` with a look-alike under `added` is the shape of
a rename nobody recorded.

So a report whose only entries are under `added` and `removed` has measured nothing, however
plausible the counts look. Read the two lists against each other before believing an empty
`changed`.
