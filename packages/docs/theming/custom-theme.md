---
title: Custom themes
description: Overriding the default palette, or adding one of your own.
---

# Custom themes

Every token is a CSS custom property, so overriding them in your own stylesheet is enough. There
is no rebuild of the package, and no need to go through a theme file at all:

```css
:root {
  --accent: oklch(0.62 0.19 253.83);
  --radius: 0.5rem;
}
```

Author CSS outside a cascade layer outranks everything the library declares, so these win wherever
you put them.

## Adding a palette rather than changing the default

Write the same token block under your own attribute:

```css
@layer theme {
  [data-theme="ocean"] {
    color-scheme: light;

    --accent: oklch(0.62 0.14 220);
    --accent-hover: color-mix(in oklab, var(--accent) 90%, var(--accent-foreground) 10%);
    /* … */
  }
}
```

**It has to redeclare the derived tokens too, not just the authored ones.** A custom property
substitutes `var()` at the element where it is *declared*, so an `--accent-hover` inherited from
`:root` would still be mixed from the root's `--accent` — the hover would stay the old colour
while the resting state moved. Copying a bundled theme and editing it is the reliable way in.

## What a theme does not need to carry

Only colours. Everything keyed on neither the palette nor the appearance — `--spacing`,
`--cursor-*`, the primitives, the shadows, `--backdrop` — stays on `:root` and `.dark` in the
default theme, and both of those keep matching an element that carries a `data-theme`.

## Both halves, always

A palette that declares only its light block loses to `:root`'s dark placeholder under
`.dark`: the two have equal specificity, and source order decides. Declare both, the way the
bundled ones do:

```css
[data-theme="ocean"] { /* light */ }
[data-theme="ocean"].dark,
.dark [data-theme="ocean"] { /* dark */ }
```

The second selector is what lets a subtree carry a palette while the page carries the appearance.
