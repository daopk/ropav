# Migration harness

Temporary. Everything in this directory exists to watch one change — the removal of Tailwind from
the two published packages — and is deleted with the last step of it.

## What it is for

The migration rewrites how declarations are *written*. `@apply px-3 py-2` becomes the padding it
stood for; a ring becomes two custom properties; the reset gains a scope. None of that is supposed
to change what a component looks like, and none of it can be checked by diffing declarations:
a rule that moves between layers, or loses a `:where()`, declares exactly what it declared before
and lands differently.

So the check is the computed style of a rendered element, which is the cascade's answer rather
than its input.

## How it works

`cases.ts` reads every rule in the `components` layer out of CSSOM — the parsed sheet, because the
layer a rule ended up in is half the question. `selector-dom.ts` builds the smallest DOM each rule
matches, and `matches()` decides whether it succeeded, so a gap in the parser costs coverage and
never produces a case measuring the wrong element. `render.ts` mounts all of them under each mode
and records what the browser resolved, minus what the same tree resolves to with the last element's
own classes and attributes taken off.

`coverage.browser.test.ts` is the guard on the harness itself: it fails if the matrix stops
reaching the layer.

## Freezing and comparing

The golden is **not committed**. It is 2.5 MB of machine output, several steps of the migration
change it on purpose, and a file like that gets regenerated to make a suite green rather than read
— which is the failure this harness is supposed to prevent, not cause.

Freeze it from the tree you are migrating *away* from:

```bash
VITE_FREEZE_STYLES=1 pnpm --filter ropav exec vitest run --project vue-browser tests/styles/migration -u
```

That writes `__baseline__/computed-styles.json`, which is gitignored. Copy it into the working tree
and run the suite normally; the snapshot test then reports which cases moved, and by which
property, rather than dumping the file.
